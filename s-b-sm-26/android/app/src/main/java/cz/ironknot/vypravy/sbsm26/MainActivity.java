package cz.ironknot.vypravy.sbsm26;

import android.os.Bundle;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.BridgeWebViewClient;

public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        // Serve .pmtiles with real HTTP 206 Range (Capacitor's built-in handler is broken).
        if (this.bridge != null) {
            this.bridge.setWebViewClient(
                new BridgeWebViewClient(this.bridge) {
                    @Override
                    public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                        WebResourceResponse pmtiles = PmtilesRangeServer.tryServe(getAssets(), request);
                        if (pmtiles != null) {
                            return pmtiles;
                        }
                        return super.shouldInterceptRequest(view, request);
                    }
                }
            );
        }
    }

    @Override
    public void onPause() {
        super.onPause();
        WebView view = this.bridge != null ? this.bridge.getWebView() : null;
        if (view != null) {
            view.onPause();
        }
    }

    @Override
    public void onResume() {
        super.onResume();
        WebView view = this.bridge != null ? this.bridge.getWebView() : null;
        if (view != null) {
            view.onResume();
        }
    }
}
