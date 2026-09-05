package cz.ironknot.vypravy.sbsm26;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

/**
 * Registers {@link PmtilesAssetPlugin} so offline Protomaps can read .pmtiles
 * via native byte ranges (WebView HTTP Range is unsuitable for large assets).
 */
public class MainActivity extends BridgeActivity {

    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(PmtilesAssetPlugin.class);
        super.onCreate(savedInstanceState);
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
