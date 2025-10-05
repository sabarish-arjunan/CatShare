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
    // For Android 11 and above
    getWindow().setDecorFitsSystemWindows(true);
  } else {
    // For Android 10 and below
    getWindow().clearFlags(WindowManager.LayoutParams.FLAG_LAYOUT_NO_LIMITS);
    getWindow().setFlags(
      WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN,
      WindowManager.LayoutParams.FLAG_FORCE_NOT_FULLSCREEN
    );
  }
}
}
