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

  if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.R) {
    // For Android 11 and above: draw under system bars
    getWindow().setDecorFitsSystemWindows(false);
  } else {
    // For Android 10 and below: allow layout under status bar
    getWindow().addFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
  }
}
}
