package cz.ironknot.vypravy.sbsm26;

import android.content.res.AssetFileDescriptor;
import android.util.Base64;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.FileInputStream;
import java.io.IOException;
import java.nio.ByteBuffer;
import java.nio.channels.FileChannel;
import java.util.HashMap;
import java.util.Map;
import java.util.UUID;

/**
 * Byte-range reads of packed .pmtiles from APK assets.
 *
 * Capacitor WebView HTTP Range cannot seek correctly inside large assets, so
 * Protomaps must read via this native bridge instead of fetch().
 *
 * Paths are relative to assets/public/ (e.g. "offline/basemap.pmtiles").
 * Assets must be stored uncompressed (aapt noCompress 'pmtiles').
 */
@CapacitorPlugin(name = "PmtilesAsset")
public class PmtilesAssetPlugin extends Plugin {

    private static final class Handle {
        final AssetFileDescriptor afd;
        final FileInputStream fis;
        final FileChannel channel;
        final long size;
        final long startOffset;

        Handle(AssetFileDescriptor afd) throws IOException {
            this.afd = afd;
            this.size = afd.getLength();
            this.startOffset = afd.getStartOffset();
            // Shared FD — never close fis alone (would invalidate afd).
            this.fis = new FileInputStream(afd.getFileDescriptor());
            this.channel = this.fis.getChannel();
        }

        void close() {
            try {
                afd.close();
            } catch (IOException ignored) {}
        }
    }

    private final Map<String, Handle> openFiles = new HashMap<>();

    @PluginMethod
    public void open(PluginCall call) {
        String path = call.getString("path");
        if (path == null || path.isEmpty()) {
            call.reject("path required");
            return;
        }
        if (path.contains("..") || path.startsWith("/")) {
            call.reject("invalid path");
            return;
        }
        try {
            AssetFileDescriptor afd = getContext().getAssets().openFd("public/" + path);
            String id = UUID.randomUUID().toString();
            Handle handle = new Handle(afd);
            synchronized (openFiles) {
                openFiles.put(id, handle);
            }
            JSObject ret = new JSObject();
            ret.put("id", id);
            ret.put("size", handle.size);
            call.resolve(ret);
        } catch (IOException e) {
            call.reject("open failed: " + e.getMessage(), e);
        }
    }

    @PluginMethod
    public void read(PluginCall call) {
        String id = call.getString("id");
        Long offsetObj = call.getLong("offset");
        Integer lengthObj = call.getInt("length");
        if (id == null || offsetObj == null || lengthObj == null) {
            call.reject("id, offset, length required");
            return;
        }
        long offset = offsetObj;
        int length = lengthObj;
        if (offset < 0 || length <= 0 || length > 8 * 1024 * 1024) {
            call.reject("invalid offset/length");
            return;
        }

        Handle handle;
        synchronized (openFiles) {
            handle = openFiles.get(id);
        }
        if (handle == null) {
            call.reject("unknown id");
            return;
        }
        if (offset >= handle.size) {
            JSObject empty = new JSObject();
            empty.put("data", "");
            call.resolve(empty);
            return;
        }
        int toRead = (int) Math.min((long) length, handle.size - offset);

        synchronized (handle) {
            try {
                handle.channel.position(handle.startOffset + offset);
                ByteBuffer buf = ByteBuffer.allocate(toRead);
                int read = 0;
                while (read < toRead) {
                    int n = handle.channel.read(buf);
                    if (n < 0) {
                        break;
                    }
                    read += n;
                }
                byte[] bytes;
                if (read == toRead) {
                    bytes = buf.array();
                } else {
                    bytes = new byte[Math.max(read, 0)];
                    if (read > 0) {
                        System.arraycopy(buf.array(), 0, bytes, 0, read);
                    }
                }
                JSObject ret = new JSObject();
                ret.put("data", Base64.encodeToString(bytes, Base64.NO_WRAP));
                call.resolve(ret);
            } catch (IOException e) {
                call.reject("read failed: " + e.getMessage(), e);
            }
        }
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

    @Override
    protected void handleOnDestroy() {
        synchronized (openFiles) {
            for (Handle h : openFiles.values()) {
                h.close();
            }
            openFiles.clear();
        }
        super.handleOnDestroy();
    }
}
