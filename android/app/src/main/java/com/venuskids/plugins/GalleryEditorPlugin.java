package com.venuskids.plugins;

import android.content.Intent;
import android.net.Uri;
import android.webkit.MimeTypeMap;
import androidx.core.content.FileProvider;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.io.File;

@CapacitorPlugin(name = "GalleryEditor")
public class GalleryEditorPlugin extends Plugin {

  public void openEditor(PluginCall call) {
    String path = call.getString("path");
    if (path == null || path.isEmpty()) {
      call.reject("Missing path");
      return;
    }

    File imageFile = new File(path);
    if (!imageFile.exists()) {
      call.reject("File not found");
      return;
    }

    Uri uri = FileProvider.getUriForFile(
      getContext(),
      getContext().getPackageName() + ".fileprovider",
      imageFile
    );

    String type = getMimeType(path);
    Intent intent = new Intent(Intent.ACTION_EDIT);
    intent.setDataAndType(uri, type);
    intent.addFlags(Intent.FLAG_GRANT_READ_URI_PERMISSION | Intent.FLAG_GRANT_WRITE_URI_PERMISSION);

    getActivity().startActivity(intent);
    call.resolve();
  }

  private String getMimeType(String path) {
    String extension = MimeTypeMap.getFileExtensionFromUrl(path);
    return MimeTypeMap.getSingleton().getMimeTypeFromExtension(extension);
  }
}
