package cz.ironknot.vypravy.sbsm26;

import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
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
