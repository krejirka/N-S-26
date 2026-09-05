package cz.ironknot.vypravy.sbsm26;

import android.content.res.AssetFileDescriptor;
import android.content.res.AssetManager;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import java.io.FileInputStream;
import java.io.FilterInputStream;
import java.io.IOException;
import java.io.InputStream;
import java.util.HashMap;
import java.util.Map;

/**
 * Capacitor's WebViewLocalServer "Range" support is broken for PMTiles:
 * it never seeks to the requested offset and uses InputStream.available() as
 * file size. Protomaps needs real HTTP 206 byte serving against uncompressed
 * APK assets (aapt noCompress 'pmtiles').
 */
final class PmtilesRangeServer {

    private PmtilesRangeServer() {}

    static WebResourceResponse tryServe(AssetManager assets, WebResourceRequest request) {
        if (request == null || assets == null) {
            return null;
        }
        if (!"GET".equalsIgnoreCase(request.getMethod())) {
            return null;
        }
        String path = request.getUrl() != null ? request.getUrl().getPath() : null;
        if (path == null || !path.endsWith(".pmtiles")) {
            return null;
        }

        // Capacitor web root is android assets/public/
        String assetPath = path.startsWith("/") ? "public" + path : "public/" + path;
        AssetFileDescriptor afd = null;
        try {
            afd = assets.openFd(assetPath);
            final long fileLen = afd.getLength();
            if (fileLen <= 0) {
                afd.close();
                return null;
            }

            long start = 0;
            long end = fileLen - 1;
            boolean partial = false;
            Map<String, String> reqHeaders = request.getRequestHeaders();
            String range = reqHeaders != null ? reqHeaders.get("Range") : null;
            if (range == null && reqHeaders != null) {
                // Some WebViews lowercase header names
                for (Map.Entry<String, String> e : reqHeaders.entrySet()) {
                    if (e.getKey() != null && e.getKey().equalsIgnoreCase("Range")) {
                        range = e.getValue();
                        break;
                    }
                }
            }

            if (range != null && range.startsWith("bytes=")) {
                partial = true;
                String spec = range.substring(6).trim();
                String[] parts = spec.split("-", 2);
                if (!parts[0].isEmpty()) {
                    start = Long.parseLong(parts[0]);
                }
                if (parts.length > 1 && !parts[1].isEmpty()) {
                    end = Long.parseLong(parts[1]);
                }
                if (end >= fileLen) {
                    end = fileLen - 1;
                }
                if (start < 0 || start > end) {
                    afd.close();
                    Map<String, String> h = baseHeaders();
                    h.put("Content-Range", "bytes */" + fileLen);
                    return new WebResourceResponse(
                        "application/octet-stream",
                        null,
                        416,
                        "Range Not Satisfiable",
                        h,
                        null
                    );
                }
            }

            final long contentLen = end - start + 1;
            FileInputStream fis = afd.createInputStream();
            long remaining = start;
            while (remaining > 0) {
                long skipped = fis.skip(remaining);
                if (skipped <= 0) {
                    break;
                }
                remaining -= skipped;
            }

            InputStream body = new LimitedAfInputStream(fis, contentLen, afd);
            afd = null; // ownership transferred to stream

            Map<String, String> headers = baseHeaders();
            headers.put("Content-Length", Long.toString(contentLen));
            if (partial) {
                headers.put("Content-Range", "bytes " + start + "-" + end + "/" + fileLen);
                return new WebResourceResponse(
                    "application/octet-stream",
                    null,
                    206,
                    "Partial Content",
                    headers,
                    body
                );
            }
            return new WebResourceResponse(
                "application/octet-stream",
                null,
                200,
                "OK",
                headers,
                body
            );
        } catch (Exception e) {
            if (afd != null) {
                try {
                    afd.close();
                } catch (IOException ignored) {}
            }
            return null;
        }
    }

    private static Map<String, String> baseHeaders() {
        Map<String, String> headers = new HashMap<>();
        headers.put("Accept-Ranges", "bytes");
        headers.put("Cache-Control", "no-store");
        headers.put("Access-Control-Allow-Origin", "*");
        return headers;
    }

    /** Caps reads at {@code limit} bytes, then closes the asset FD. */
    private static final class LimitedAfInputStream extends FilterInputStream {

        private long remaining;
        private final AssetFileDescriptor afd;
        private boolean closed;

        LimitedAfInputStream(InputStream in, long limit, AssetFileDescriptor afd) {
            super(in);
            this.remaining = limit;
            this.afd = afd;
        }

        @Override
        public int read() throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int b = super.read();
            if (b >= 0) {
                remaining--;
            }
            return b;
        }

        @Override
        public int read(byte[] buf, int off, int len) throws IOException {
            if (remaining <= 0) {
                return -1;
            }
            int n = super.read(buf, off, (int) Math.min(len, remaining));
            if (n > 0) {
                remaining -= n;
            }
            return n;
        }

        @Override
        public void close() throws IOException {
            if (closed) {
                return;
            }
            closed = true;
            try {
                super.close();
            } finally {
                try {
                    afd.close();
                } catch (IOException ignored) {}
            }
        }
    }
}
