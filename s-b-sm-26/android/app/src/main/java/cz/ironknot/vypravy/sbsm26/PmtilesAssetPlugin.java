package cz.ironknot.vypravy.sbsm26;

import android.content.res.AssetFileDescriptor;
import android.util.Base64;
import android.util.Log;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.Closeable;
import java.io.File;
import java.io.FileInputStream;
import java.io.FileOutputStream;
import java.io.InputStream;
import java.io.RandomAccessFile;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutorService;
import java.util.concurrent.Executors;

/**
 * Offline PMTiles reader for the APK.
 *
 * Prefers AssetFileDescriptor + FileChannel (pmtiles are stored uncompressed via
 * noCompress). Falls back to copying into filesDir + RandomAccessFile when the
 * asset cannot be opened as a seekable FD. Avoids WebView HTTP Range entirely.
 */
@CapacitorPlugin(name = "PmtilesAsset")
public class PmtilesAssetPlugin extends Plugin {

    private static final String TAG = "PmtilesAsset";
    private static final int MAX_READ = 2 * 1024 * 1024;
    private static final int COPY_BUF = 256 * 1024;

    private static final class Handle implements Closeable {
        final FileChannel channel;
        final long baseOffset;
        final long size;
        final Closeable primary;

        Handle(FileChannel channel, long baseOffset, long size, Closeable primary) {
            this.channel = channel;
            this.baseOffset = baseOffset;
            this.size = size;
            this.primary = primary;
        }

        void readFully(long offset, byte[] buf) throws Exception {
            long abs = baseOffset + offset;
            ByteBuffer bb = ByteBuffer.wrap(buf);
            synchronized (this) {
                channel.position(abs);
                while (bb.hasRemaining()) {
                    int n = channel.read(bb);
                    if (n < 0) {
                        throw new Exception("EOF at " + (abs + bb.position()) + " need " + buf.length);
                    }
                }
            }
        }

        @Override
        public void close() {
            try {
                channel.close();
            } catch (Exception ignored) {}
            try {
                primary.close();
            } catch (Exception ignored) {}
        }
    }

    private final Map<String, Handle> openFiles = new HashMap<>();
    private final ExecutorService io = Executors.newSingleThreadExecutor();

    @PluginMethod
    public void ping(PluginCall call) {
        JSObject ret = new JSObject();
        ret.put("ok", true);
        ret.put("plugin", "PmtilesAsset");
        call.resolve(ret);
    }

    @PluginMethod
    public void open(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty() || path.contains("..") || path.startsWith("/")) {
            call.reject("invalid path");
            return;
        }

        io.execute(() -> {
            try {
                Handle handle = openSeekable(path);
                byte[] magic = new byte[7];
                handle.readFully(0, magic);
                String magicStr = new String(magic, "US-ASCII");
                if (!"PMTiles".equals(magicStr)) {
                    handle.close();
                    call.reject("not a PMTiles file: " + magicStr);
                    return;
                }
                String id = UUID.randomUUID().toString();
                synchronized (openFiles) {
                    openFiles.put(id, handle);
                }
                JSObject ret = new JSObject();
                ret.put("id", id);
                ret.put("size", handle.size);
                ret.put("magic", magicStr);
                Log.i(TAG, "opened " + path + " size=" + handle.size);
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "open failed: " + path, e);
                call.reject("open failed: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void read(PluginCall call) {
        String id = call.getString("id");
        Double offsetD = call.getDouble("offset");
        Double lengthD = call.getDouble("length");
        if (id == null || offsetD == null || lengthD == null) {
            call.reject("id, offset, length required");
            return;
        }
        final long offset = offsetD.longValue();
        final int length = lengthD.intValue();
        if (offset < 0 || length <= 0 || length > MAX_READ) {
            call.reject("invalid offset/length");
            return;
        }

        io.execute(() -> {
            Handle handle;
            synchronized (openFiles) {
                handle = openFiles.get(id);
            }
            if (handle == null) {
                call.reject("unknown id");
                return;
            }
            try {
                if (offset >= handle.size) {
                    JSObject empty = new JSObject();
                    empty.put("data", "");
                    call.resolve(empty);
                    return;
                }
                int toRead = (int) Math.min((long) length, handle.size - offset);
                byte[] buf = new byte[toRead];
                handle.readFully(offset, buf);
                JSObject ret = new JSObject();
                ret.put("data", Base64.encodeToString(buf, Base64.NO_WRAP));
                call.resolve(ret);
            } catch (Exception e) {
                Log.e(TAG, "read failed id=" + id + " off=" + offset + " len=" + length, e);
                call.reject("read failed: " + e.getMessage(), e);
            }
        });
    }

    @PluginMethod
    public void close(PluginCall call) {
        String id = call.getString("id");
        if (id != null) {
            Handle handle;
            synchronized (openFiles) {
                handle = openFiles.remove(id);
            }
            if (handle != null) {
                handle.close();
            }
        }
        call.resolve();
    }

    private Handle openSeekable(String path) throws Exception {
        try {
            AssetFileDescriptor afd = getContext().getAssets().openFd("public/" + path);
            FileInputStream fis = new FileInputStream(afd.getFileDescriptor());
            FileChannel channel = fis.getChannel();
            long base = afd.getStartOffset();
            long size = afd.getDeclaredLength();
            if (size < 0) {
                size = afd.getLength();
            }
            if (size <= 0) {
                afd.close();
                throw new Exception("empty asset FD for " + path);
            }
            Log.i(TAG, "AFD open public/" + path + " base=" + base + " size=" + size);
            // Keep both fis and afd open for the lifetime of the handle.
            return new Handle(channel, base, size, () -> {
                try {
                    fis.close();
                } catch (Exception ignored) {}
                try {
                    afd.close();
                } catch (Exception ignored) {}
            });
        } catch (Exception afdErr) {
            Log.w(TAG, "AFD unavailable for " + path + ", copying: " + afdErr.getMessage());
            File local = ensureLocalCopy(path);
            RandomAccessFile raf = new RandomAccessFile(local, "r");
            FileChannel channel = raf.getChannel();
            Log.i(TAG, "RAF open " + local.getAbsolutePath() + " size=" + local.length());
            return new Handle(channel, 0, local.length(), raf);
        }
    }

    private File ensureLocalCopy(String path) throws Exception {
        File dest = new File(getContext().getFilesDir(), path);
        File parent = dest.getParentFile();
        if (parent != null && !parent.exists() && !parent.mkdirs()) {
            throw new Exception("cannot create " + parent);
        }

        long assetLen = -1;
        try (AssetFileDescriptor afd = getContext().getAssets().openFd("public/" + path)) {
            assetLen = afd.getLength();
        } catch (Exception ignored) {
            // compressed asset — length unknown until streamed
        }

        if (dest.exists() && assetLen > 0 && dest.length() == assetLen) {
            return dest;
        }
        if (dest.exists() && assetLen < 0 && dest.length() > 0) {
            // Keep existing stream-copied file if we cannot re-check length.
            return dest;
        }
        if (dest.exists() && !dest.delete()) {
            throw new Exception("cannot replace " + dest);
        }

        File tmp = new File(dest.getAbsolutePath() + ".tmp");
        if (tmp.exists() && !tmp.delete()) {
            throw new Exception("cannot clear temp " + tmp);
        }

        Log.i(TAG, "copying public/" + path + " → " + dest);
        long total = 0;
        try (InputStream in = getContext().getAssets().open("public/" + path);
             FileOutputStream out = new FileOutputStream(tmp)) {
            byte[] buf = new byte[COPY_BUF];
            int n;
            while ((n = in.read(buf)) >= 0) {
                out.write(buf, 0, n);
                total += n;
            }
            out.flush();
        }
        Log.i(TAG, "copied " + total + " bytes for " + path);

        if (!tmp.renameTo(dest)) {
            try (InputStream in = new FileInputStream(tmp);
                 FileOutputStream out = new FileOutputStream(dest)) {
                byte[] buf = new byte[COPY_BUF];
                int n;
                while ((n = in.read(buf)) >= 0) {
                    out.write(buf, 0, n);
                }
            }
            // noinspection ResultOfMethodCallIgnored
            tmp.delete();
        }

        if (assetLen > 0 && dest.length() != assetLen) {
            throw new Exception("copy size mismatch for " + path + ": " + dest.length() + " vs " + assetLen);
        }
        if (dest.length() <= 0) {
            throw new Exception("empty copy for " + path);
        }
        return dest;
    }

    @Override
    protected void handleOnDestroy() {
        synchronized (openFiles) {
            for (Handle h : openFiles.values()) {
                h.close();
            }
            openFiles.clear();
        }
        io.shutdownNow();
        super.handleOnDestroy();
    }
}
