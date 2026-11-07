package kkadogo.findstreamer.com

import android.app.Activity
import android.content.ComponentName
import android.content.Intent
import android.graphics.Color
import android.graphics.Typeface
import android.graphics.drawable.GradientDrawable
import android.net.Uri
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.os.Parcelable
import android.util.TypedValue
import android.view.Gravity
import android.view.KeyEvent
import android.view.View
import android.view.WindowManager
import android.widget.FrameLayout
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import android.widget.VideoView
import java.net.HttpURLConnection
import java.net.URL
import kotlin.concurrent.thread

class TrovaPlayerActivity : Activity() {

    data class SubtitleCue(val startMs: Long, val endMs: Long, val text: String)

    private lateinit var videoView: VideoView
    private lateinit var loadingSpinner: ProgressBar
    private lateinit var subtitleTextView: TextView
    private lateinit var osdOverlay: LinearLayout
    private lateinit var titleTextView: TextView
    private lateinit var timeTextView: TextView
    private lateinit var progressBar: ProgressBar
    private lateinit var statusHintView: TextView

    private val handler = Handler(Looper.getMainLooper())
    private val cues = mutableListOf<SubtitleCue>()
    private var subtitlesEnabled = true
    private var isOsdVisible = true
    private var streamUrl: String = ""
    private var streamTitle: String = "Trova TV Stream"
    private var subtitleUri: String? = null

    private val hideOsdRunnable = Runnable {
        if (::videoView.isInitialized && videoView.isPlaying) {
            osdOverlay.visibility = View.GONE
            isOsdVisible = false
        }
    }

    private val tickRunnable = object : Runnable {
        override fun run() {
            if (::videoView.isInitialized) {
                try {
                    val pos = videoView.currentPosition.toLong()
                    val dur = videoView.duration.toLong()
                    if (dur > 0) {
                        progressBar.max = (dur / 1000).toInt()
                        progressBar.progress = (pos / 1000).toInt()
                        timeTextView.text = "${formatMs(pos)}  /  ${formatMs(dur)}"
                    } else {
                        timeTextView.text = formatMs(pos)
                    }
                    updateSubtitleText(pos)
                } catch (_: Throwable) {}
            }
            handler.postDelayed(this, 250)
        }
    }

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        window.addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON)
        @Suppress("DEPRECATION")
        window.decorView.systemUiVisibility = (
            View.SYSTEM_UI_FLAG_FULLSCREEN
                or View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                or View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
        )

        streamUrl = intent.getStringExtra("streamUrl") ?: intent.dataString ?: ""
        streamTitle = intent.getStringExtra("title") ?: "Trova TV"
        subtitleUri = intent.getStringExtra("subtitleUri")

        val root = FrameLayout(this).apply {
            setBackgroundColor(Color.parseColor("#040301"))
        }

        videoView = VideoView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.MATCH_PARENT,
                Gravity.CENTER
            )
        }
        root.addView(videoView)

        loadingSpinner = ProgressBar(this).apply {
            layoutParams = FrameLayout.LayoutParams(dp(64), dp(64), Gravity.CENTER)
            visibility = View.VISIBLE
        }
        root.addView(loadingSpinner)

        subtitleTextView = TextView(this).apply {
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.WRAP_CONTENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM or Gravity.CENTER_HORIZONTAL
            ).apply {
                bottomMargin = dp(68)
                leftMargin = dp(96)
                rightMargin = dp(96)
            }
            setTextColor(Color.parseColor("#FEFBF6"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 22f)
            typeface = Typeface.create("sans-serif-medium", Typeface.BOLD)
            gravity = Gravity.CENTER
            setPadding(dp(18), dp(8), dp(18), dp(8))
            background = GradientDrawable().apply {
                setColor(Color.parseColor("#CC040301"))
                cornerRadius = dp(8).toFloat()
            }
            visibility = View.GONE
        }
        root.addView(subtitleTextView)

        osdOverlay = LinearLayout(this).apply {
            orientation = LinearLayout.VERTICAL
            layoutParams = FrameLayout.LayoutParams(
                FrameLayout.LayoutParams.MATCH_PARENT,
                FrameLayout.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM
            )
            setPadding(dp(48), dp(28), dp(48), dp(36))
            background = GradientDrawable(
                GradientDrawable.Orientation.BOTTOM_TOP,
                intArrayOf(
                    Color.parseColor("#F2040301"),
                    Color.parseColor("#B3040301"),
                    Color.TRANSPARENT
                )
            )
        }

        titleTextView = TextView(this).apply {
            text = streamTitle
            setTextColor(Color.parseColor("#F5EEE1"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 24f)
            typeface = Typeface.DEFAULT_BOLD
            maxLines = 1
        }
        osdOverlay.addView(titleTextView)

        progressBar = ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal).apply {
            layoutParams = LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                dp(8)
            ).apply {
                topMargin = dp(12)
                bottomMargin = dp(10)
            }
            max = 100
            progress = 0
        }
        osdOverlay.addView(progressBar)

        val bottomMetaRow = LinearLayout(this).apply {
            orientation = LinearLayout.HORIZONTAL
            gravity = Gravity.CENTER_VERTICAL
        }

        timeTextView = TextView(this).apply {
            text = "Buffering peer swarm..."
            setTextColor(Color.parseColor("#D4A853"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 15f)
            typeface = Typeface.DEFAULT_BOLD
            layoutParams = LinearLayout.LayoutParams(0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f)
        }
        bottomMetaRow.addView(timeTextView)

        statusHintView = TextView(this).apply {
            text = "OK: Play/Pause  •  Left/Right: Seek 15s  •  Up: Subtitles  •  Down: Open in mpv  •  Back: Exit"
            setTextColor(Color.parseColor("#A39E94"))
            setTextSize(TypedValue.COMPLEX_UNIT_SP, 13f)
        }
        bottomMetaRow.addView(statusHintView)

        osdOverlay.addView(bottomMetaRow)
        root.addView(osdOverlay)

        setContentView(root)

        if (!subtitleUri.isNullOrBlank()) {
            loadSubtitlesAsync(subtitleUri!!)
        }

        if (streamUrl.isNotBlank()) {
            videoView.setVideoURI(Uri.parse(streamUrl))
            videoView.setOnPreparedListener { mp ->
                loadingSpinner.visibility = View.GONE
                mp.setOnInfoListener { _, what, _ ->
                    when (what) {
                        android.media.MediaPlayer.MEDIA_INFO_BUFFERING_START -> loadingSpinner.visibility = View.VISIBLE
                        android.media.MediaPlayer.MEDIA_INFO_BUFFERING_END -> loadingSpinner.visibility = View.GONE
                    }
                    false
                }
                videoView.start()
                showOsdTemporarily()
            }
            videoView.setOnErrorListener { _, _, _ ->
                loadingSpinner.visibility = View.GONE
                timeTextView.text = "Codec requires external player — launching mpv..."
                launchExternalMpv()
                true
            }
        }

        handler.post(tickRunnable)
    }

    private fun showOsdTemporarily() {
        osdOverlay.visibility = View.VISIBLE
        isOsdVisible = true
        handler.removeCallbacks(hideOsdRunnable)
        handler.postDelayed(hideOsdRunnable, 4500)
    }

    override fun onKeyDown(keyCode: Int, event: KeyEvent?): Boolean {
        showOsdTemporarily()
        when (keyCode) {
            KeyEvent.KEYCODE_DPAD_CENTER,
            KeyEvent.KEYCODE_ENTER,
            KeyEvent.KEYCODE_MEDIA_PLAY_PAUSE,
            KeyEvent.KEYCODE_SPACE -> {
                if (videoView.isPlaying) {
                    videoView.pause()
                    loadingSpinner.visibility = View.GONE
                } else {
                    videoView.start()
                }
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PLAY -> {
                if (!videoView.isPlaying) videoView.start()
                return true
            }
            KeyEvent.KEYCODE_MEDIA_PAUSE -> {
                if (videoView.isPlaying) videoView.pause()
                return true
            }
            KeyEvent.KEYCODE_DPAD_RIGHT,
            KeyEvent.KEYCODE_MEDIA_FAST_FORWARD -> {
                val target = (videoView.currentPosition + 15000).coerceAtMost(videoView.duration.coerceAtLeast(15000))
                videoView.seekTo(target)
                return true
            }
            KeyEvent.KEYCODE_DPAD_LEFT,
            KeyEvent.KEYCODE_MEDIA_REWIND -> {
                val target = (videoView.currentPosition - 15000).coerceAtLeast(0)
                videoView.seekTo(target)
                return true
            }
            KeyEvent.KEYCODE_DPAD_UP -> {
                subtitlesEnabled = !subtitlesEnabled
                if (!subtitlesEnabled) subtitleTextView.visibility = View.GONE
                statusHintView.text = if (subtitlesEnabled) "Subtitles: ON" else "Subtitles: OFF"
                return true
            }
            KeyEvent.KEYCODE_DPAD_DOWN -> {
                launchExternalMpv()
                return true
            }
            KeyEvent.KEYCODE_BACK,
            KeyEvent.KEYCODE_ESCAPE -> {
                finish()
                return true
            }
        }
        return super.onKeyDown(keyCode, event)
    }

    private fun launchExternalMpv() {
        try {
            val intent = Intent(Intent.ACTION_VIEW).apply {
                setDataAndType(Uri.parse(streamUrl), "video/*")
                component = ComponentName("is.xyz.mpv", "is.xyz.mpv.MPVActivity")
                flags = Intent.FLAG_ACTIVITY_NEW_TASK
                putExtra("title", streamTitle)
                if (!subtitleUri.isNullOrBlank()) {
                    val subUri = Uri.parse(subtitleUri)
                    val subArray = arrayOf<Parcelable>(subUri)
                    putExtra("subs", subArray)
                    putExtra("subs.enable", subArray)
                    putExtra("subtitles_location", subtitleUri)
                }
            }
            startActivity(intent)
            finish()
        } catch (_: Throwable) {
            statusHintView.text = "mpv not installed; playing in built-in Trova TV player"
        }
    }

    private fun updateSubtitleText(positionMs: Long) {
        if (!subtitlesEnabled || cues.isEmpty()) {
            subtitleTextView.visibility = View.GONE
            return
        }
        val active = cues.firstOrNull { positionMs in it.startMs..it.endMs }
        if (active != null && active.text.isNotBlank()) {
            subtitleTextView.text = active.text
            subtitleTextView.visibility = View.VISIBLE
        } else {
            subtitleTextView.visibility = View.GONE
        }
    }

    private fun loadSubtitlesAsync(urlStr: String) {
        thread {
            try {
                val conn = URL(urlStr).openConnection() as HttpURLConnection
                conn.connectTimeout = 5000
                conn.readTimeout = 5000
                val raw = conn.inputStream.bufferedReader(Charsets.UTF_8).readText()
                val parsed = parseSrt(raw)
                handler.post {
                    cues.clear()
                    cues.addAll(parsed)
                }
            } catch (_: Throwable) {}
        }
    }

    private fun parseSrt(srt: String): List<SubtitleCue> {
        val result = mutableListOf<SubtitleCue>()
        val blocks = srt.replace("\r\n", "\n").split("\n\n")
        val timeRegex = Regex("""(\d{2}):(\d{2}):(\d{2})[,.](\d{3})\s*-->\s*(\d{2}):(\d{2}):(\d{2})[,.](\d{3})""")
        for (block in blocks) {
            val lines = block.trim().lines()
            if (lines.size < 2) continue
            val timeLineIdx = lines.indexOfFirst { it.contains("-->") }
            if (timeLineIdx == -1 || timeLineIdx >= lines.size - 1) continue
            val match = timeRegex.find(lines[timeLineIdx]) ?: continue
            val g = match.groupValues
            val startMs = toMs(g[1], g[2], g[3], g[4])
            val endMs = toMs(g[5], g[6], g[7], g[8])
            val text = lines.subList(timeLineIdx + 1, lines.size)
                .joinToString("\n")
                .replace(Regex("<[^>]*>"), "")
                .trim()
            if (text.isNotEmpty()) {
                result.add(SubtitleCue(startMs, endMs, text))
            }
        }
        return result
    }

    private fun toMs(h: String, m: String, s: String, ms: String): Long {
        return h.toLong() * 3600000L + m.toLong() * 60000L + s.toLong() * 1000L + ms.toLong()
    }

    private fun formatMs(ms: Long): String {
        val totalSec = (ms / 1000).coerceAtLeast(0)
        val hrs = totalSec / 3600
        val mins = (totalSec % 3600) / 60
        val secs = totalSec % 60
        return if (hrs > 0) {
            String.format("%d:%02d:%02d", hrs, mins, secs)
        } else {
            String.format("%02d:%02d", mins, secs)
        }
    }

    private fun dp(value: Int): Int {
        return TypedValue.applyDimension(
            TypedValue.COMPLEX_UNIT_DIP,
            value.toFloat(),
            resources.displayMetrics
        ).toInt()
    }

    override fun onDestroy() {
        handler.removeCallbacksAndMessages(null)
        try {
            videoView.stopPlayback()
        } catch (_: Throwable) {}
        super.onDestroy()
    }
}
