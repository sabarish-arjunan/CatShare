package com.venuskids.catalogue;

import android.os.Build;
import android.os.Bundle;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.byteowls.capacitor.filesharer.FileSharerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(FileSharerPlugin.class);

    // Ensure the app does NOT draw behind the status bar.
    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      // Android 11+ API: have the window fit system windows (no edge-to-edge)
      getWindow().setDecorFitsSystemWindows(true);
    } else {
      // Android 10 and below: clear flags that allow layout behind status bar
      getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
      getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
      getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
    }
  }
}
