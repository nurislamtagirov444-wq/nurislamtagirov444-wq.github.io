package com.ai.appmanager

import android.app.AppOpsManager
import android.app.usage.UsageStats
import android.app.usage.UsageStatsManager
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.os.Bundle
import android.provider.Settings
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import java.util.Calendar

class MainActivity : AppCompatActivity() {

    private lateinit var btnPermission: Button
    private lateinit var btnAiAnalyze: Button
    private lateinit var tvStats: TextView

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)

        val btnPerm = findViewById<Button>(R.id.btnPermission)
        val btnAi = findViewById<Button>(R.id.btnAiAnalyze)
        val tvText = findViewById<TextView>(R.id.tvStats)

        btnPerm.setOnClickListener {
            startActivity(Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS))
        }

        btnAi.setOnClickListener {
            if (!hasUsageStatsPermission()) {
                tvText.text = "Please grant usage permission first!"
                return@setOnClickListener
            }
            tvText.text = "Analyzing with AI...\n\n"
            analyzeApps(tvText)
        }
    }

    override fun onResume() {
        super.onResume()
        if (hasUsageStatsPermission()) {
            findViewById<Button>(R.id.btnPermission).isEnabled = false
            findViewById<Button>(R.id.btnPermission).text = "Permission Granted"
        }
    }

    private fun hasUsageStatsPermission(): Boolean {
        val appOps = getSystemService(Context.APP_OPS_SERVICE) as AppOpsManager
        val mode = appOps.checkOpNoThrow(
            AppOpsManager.OPSTR_GET_USAGE_STATS,
            android.os.Process.myUid(), packageName
        )
        return mode == AppOpsManager.MODE_ALLOWED
    }

    private fun analyzeApps(tvText: TextView) {
        val usageStatsManager = getSystemService(Context.USAGE_STATS_SERVICE) as UsageStatsManager
        val cal = Calendar.getInstance()
        cal.add(Calendar.DAY_OF_YEAR, -1)

        val queryUsageStats = usageStatsManager.queryUsageStats(
            UsageStatsManager.INTERVAL_DAILY,
            cal.timeInMillis, System.currentTimeMillis()
        )

        if (queryUsageStats.isNullOrEmpty()) {
            tvText.append("No usage stats available.")
            return
        }

        val pm = packageManager
        val statsList = queryUsageStats.filter { it.totalTimeInForeground > 0 }
            .sortedByDescending { it.totalTimeInForeground }
            .take(10)

        val sb = java.lang.StringBuilder()
        sb.append("--- AI Usage Analysis ---\n")
        
        var mostUsed = ""
        var maxTime = 0L

        for (stats in statsList) {
            val appName = try {
                val appInfo = pm.getApplicationInfo(stats.packageName, 0)
                pm.getApplicationLabel(appInfo).toString()
            } catch (e: PackageManager.NameNotFoundException) {
                stats.packageName
            }
            val minutes = stats.totalTimeInForeground / 1000 / 60
            sb.append("$appName : $minutes min\n")
            if (stats.totalTimeInForeground > maxTime) {
                maxTime = stats.totalTimeInForeground
                mostUsed = appName
            }
        }

        sb.append("\n💡 AI Recommendation:\n")
        if (mostUsed.isNotEmpty()) {
            val maxMin = maxTime / 1000 / 60
            if (maxMin > 60) {
                sb.append("You spend a lot of time on $mostUsed ($maxMin minutes). Consider setting a daily limit to improve productivity!\n")
            } else {
                sb.append("Great job! Your app usage is well balanced.\n")
            }
            sb.append("\nTo manage your digital wellbeing, this AI recommends checking alternative lightweight apps.")
        }
        
        tvText.append(sb.toString())
    }
}
