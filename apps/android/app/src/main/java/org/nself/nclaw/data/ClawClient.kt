package org.nself.nclaw.data

import android.content.Context
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import java.util.concurrent.TimeUnit

class ClawClient(private val context: Context) {

    private val client = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    private val prefs by lazy {
        context.getSharedPreferences("nclaw_settings", Context.MODE_PRIVATE)
    }

    var serverURL: String
        get() = prefs.getString("server_url", "") ?: ""
        set(value) = prefs.edit().putString("server_url", value).apply()

    var apiKey: String
        get() = prefs.getString("api_key", "") ?: ""
        set(value) = prefs.edit().putString("api_key", value).apply()

    suspend fun sendMessage(text: String): String = withContext(Dispatchers.IO) {
        val baseURL = serverURL.trimEnd('/')
        if (baseURL.isBlank()) {
            throw ClawException("Server URL not configured. Check settings.")
        }

        val json = JSONObject().apply {
            put("message", text)
        }

        val body = json.toString().toRequestBody("application/json".toMediaType())

        val requestBuilder = Request.Builder()
            .url("$baseURL/claw/chat")
            .post(body)

        val key = apiKey
        if (key.isNotBlank()) {
            requestBuilder.addHeader("Authorization", "Bearer $key")
        }

        val response = client.newCall(requestBuilder.build()).execute()
        val responseBody = response.body?.string() ?: ""

        if (!response.isSuccessful) {
            throw ClawException("Server error (${response.code}): $responseBody")
        }

        val responseJson = JSONObject(responseBody)
        responseJson.optString("reply", "")
            .ifBlank { throw ClawException("Empty reply from server.") }
    }
}

class ClawException(message: String) : Exception(message)
