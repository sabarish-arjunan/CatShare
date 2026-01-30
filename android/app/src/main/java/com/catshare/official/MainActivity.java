package com.catshare.official;

import com.getcapacitor.BridgeActivity;
import com.getcapacitor.community.database.sqlite.CapacitorSQLite;
import com.getcapacitor.community.database.sqlite.CapacitorSQLitePlugin;
import com.getcapacitor.Plugin;

import java.util.ArrayList;

public class MainActivity extends BridgeActivity {
  @Override
  public void onCreate(Bundle savedInstanceState) {
    super.onCreate(savedInstanceState);

    registerPlugin(CapacitorSQLitePlugin.class);
    registerPlugin(com.getcapacitor.pushnotifications.PushNotifications.class);

    // ... other plugins
  }
}
