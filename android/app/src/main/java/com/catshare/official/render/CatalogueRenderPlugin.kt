package com.catshare.official.render

import com.getcapacitor.Plugin
import com.getcapacitor.PluginCall
import com.getcapacitor.PluginMethod

class CatalogueRenderPlugin : Plugin() {

    @PluginMethod
    fun render(call: PluginCall) {
        val html = call.getString("html")
        val fileName = call.getString("fileName")

        if (html == null || fileName == null) {
            call.reject("html or fileName missing")
            return
        }

        RenderManager.enqueue(context, html, fileName)
        call.resolve()
    }
}
