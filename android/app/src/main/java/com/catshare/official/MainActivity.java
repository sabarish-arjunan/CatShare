package com.catshare.official;

import android.graphics.Color;
import android.os.Build;
import android.os.Bundle;
import android.view.View;
import android.view.WindowInsetsController;
import android.view.WindowManager;

import com.getcapacitor.BridgeActivity;
import com.byteowls.capacitor.filesharer.FileSharerPlugin;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);
    registerPlugin(FileSharerPlugin.class);

    // Always keep webview below the status bar (no overlay) and make status bar blue with light icons
    final int blue = Color.parseColor("#2563EB"); // matches colorPrimaryDark

    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
      getWindow().setDecorFitsSystemWindows(true);
      getWindow().setStatusBarColor(blue);
      final WindowInsetsController c = getWindow().getInsetsController();
      if (c != null) {
        // Ensure light icons (white) on colored status bar
        c.setSystemBarsAppearance(0, WindowInsetsController.APPEARANCE_LIGHT_STATUS_BARS);
      }
    } else {
      // Android 10 and below
      getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
      getWindow().clearFlags(WindowManager.LayoutParams.FLAG_TRANSLUCENT_STATUS);
      getWindow().addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
      getWindow().setStatusBarColor(blue);
      // Ensure light icons by clearing LIGHT_STATUS_BAR flag
      final View decor = getWindow().getDecorView();
      int vis = decor.getSystemUiVisibility();
      vis &= ~View.SYSTEM_UI_FLAG_LIGHT_STATUS_BAR;
      decor.setSystemUiVisibility(vis);
    }
  }
}
