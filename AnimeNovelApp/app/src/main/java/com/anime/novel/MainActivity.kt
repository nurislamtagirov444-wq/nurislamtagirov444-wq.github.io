package com.anime.novel

import android.os.Bundle
import android.view.View
import android.widget.Button
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity

class MainActivity : AppCompatActivity() {

    // Класс для хранения одной сцены (кадра) новеллы
    data class Scene(
        val id: Int, 
        val name: String, 
        val text: String, 
        val opt1: String? = null, 
        val next1: Int? = null, 
        val opt2: String? = null, 
        val next2: Int? = null
    )

    // Сюжет нашей аниме-новеллы
    private val story = mapOf(
        1 to Scene(1, "Акира", "Привет! Ты наконец-то проснулся. Мы опаздываем в магическую академию!", "Встать и пойти", 2, "Спать дальше", 3),
        2 to Scene(2, "Акира", "Отлично, бежим! Сегодня распределение по магическим гильдиям.", "Бежать за ней", 4, null, null),
        3 to Scene(3, "Система", "Вы проспали важный день. Ваша история закончилась, так и не начавшись. (ПЛОХАЯ КОНЦОВКА)", "Начать заново", 1, null, null),
        4 to Scene(4, "Акира", "Фух, успели. Смотри, это же древний артефакт... он светится рядом с тобой!", "Прикоснуться к нему", 5, "Отойти в сторону", 6),
        5 to Scene(5, "Система", "Артефакт вспыхнул ослепительным светом. Вы обрели невероятную силу! (ХОРОШАЯ КОНЦОВКА)", "Начать заново", 1, null, null),
        6 to Scene(6, "Акира", "Осторожность не повредит. Пойдем лучше на лекцию. (НЕЙТРАЛЬНАЯ КОНЦОВКА)", "Начать заново", 1, null, null)
    )

    private var currentSceneId = 1

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_main)
        
        // TODO: Загрузить красивые аниме-спрайты для фона и персонажей в ImageView
        // FIXME: Настроить музыку на фоне через MediaPlayer

        updateUI()
    }

    private fun updateUI() {
        val scene = story[currentSceneId] ?: return
        
        findViewById<TextView>(R.id.tvName).text = scene.name
        findViewById<TextView>(R.id.tvText).text = scene.text
        
        val btn1 = findViewById<Button>(R.id.btnOpt1)
        val btn2 = findViewById<Button>(R.id.btnOpt2)

        if (scene.opt1 != null) {
            btn1.visibility = View.VISIBLE
            btn1.text = scene.opt1
            btn1.setOnClickListener { 
                currentSceneId = scene.next1!!
                updateUI() 
            }
        } else {
            btn1.visibility = View.GONE
        }

        if (scene.opt2 != null) {
            btn2.visibility = View.VISIBLE
            btn2.text = scene.opt2
            btn2.setOnClickListener { 
                currentSceneId = scene.next2!!
                updateUI() 
            }
        } else {
            btn2.visibility = View.GONE
        }
    }
}
