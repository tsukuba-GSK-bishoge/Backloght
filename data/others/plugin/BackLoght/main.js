//諸々の関数の置き換えやバックログジャンプ用の変数定義
(function () {

  /********************************************
 * ↓ tyrano.plugin.kag.tmp.BackLoght 
 *********************************************/
  tyrano.plugin.kag.tmp.BackLoght = {
    backlogJump: {
      saveFile: [],//バックログジャンプに使うセーブデータの配列。最大保持数はconfig.tjsのbacklogNumに依存。
      isCanBacklogJumpText: true,//バックログジャンプができるテキストであるかどうか。基本的にtrueで、バックログにのみ表示するテキストでだけfalse
      pushSaveFile(pushData) {	//saveFileへの値追加。
        //データの挿入
        this.saveFile.push(pushData);
        //tyrano.plugin.kag.config.maxBackLogNumで指定した数を超えたら古いものから削除。
        if (TYRANO.kag.variable.sf.blj.maxSaveFileNum < this.saveFile.length) {
          this.saveFile.shift();
        }

      }
    }
  };
  /********************************************
 * ↑ tyrano.plugin.kag.tmp.BackLoght
 *********************************************/
  /********************************************
 * ↓ tyrano.plugin.kag.tag.p 
 *********************************************/
  let _p = tyrano.plugin.kag.tag.p
  let _kag = tyrano.plugin.kag.ftag.master_tag.p.kag
  tyrano.plugin.kag.tag.p = $.extend(true, {}, _p, {
    start: function () {
      var that = this;

      //改ページ
      this.kag.stat.flag_ref_page = true;

      this.kag.stat.is_click_text = false;
      this.kag.ftag.showNextImg();

      //
      // スキップまたはオートモード時の処理
      //

      // スキップモードの場合は単に次のタグに進んで早期リターン
      if (this.kag.stat.is_skip == true) {
          this.kag.ftag.nextOrder();
          return;
      }

      // ここに到達したということは
      // スキップモード中ではない

      // オートモード時は現在表示されているメッセージ量から待機時間を計算して
      // setTimeout で次のタグに進む
      if (this.kag.stat.is_auto == true) {
          this.kag.stat.is_wait_auto = true;

          var auto_speed = that.kag.config.autoSpeed;
          if (that.kag.config.autoSpeedWithText != "0") {
              var cnt_text = this.kag.stat.current_message_str.length;
              auto_speed = parseInt(auto_speed) + parseInt(that.kag.config.autoSpeedWithText) * cnt_text;
          }

          setTimeout(function () {
              if (that.kag.stat.is_wait_auto == true) {
                  //ボイス再生中の場合は、オートで次に行かない。効果音再生終了後に進めるためのフラグを立てる
                  if (that.kag.tmp.is_vo_play == true) {
                      that.kag.tmp.is_vo_play_wait = true;
                  } else {
                      // クリック待ちグリフを消去
                      that.kag.ftag.hideNextImg();
                      that.kag.ftag.nextOrder();
                  }
              }
          }, auto_speed);
      }

      // waitClick を呼んでイベントレイヤ―の表示処理などを行う
      this.kag.waitClick("p");

    },


    });
  tyrano.plugin.kag.ftag.master_tag.p = tyrano.plugin.kag.tag.p;
  tyrano.plugin.kag.ftag.master_tag.p.kag = _kag;
  /********************************************
 * ↑ tyrano.plugin.kag.tag.p 
 *********************************************/

  /********************************************
 * ↓ tyrano.plugin.kag.menu.loadGameData
 *********************************************/

  tyrano.plugin.kag.menu.loadGameData = function (data, options) {

    const that = this;

    // ロードを始める前にイベントレイヤを非表示にする
    this.kag.layer.hideEventLayer();

    // ティラノイベント"load-start"を発火
    this.kag.trigger("load-start");

        // 瞬きを停止
        this.kag.chara.stopAllFrameAnimation();

    // 一時リスナをすべて消去
    this.kag.offTempListeners();

    //普通のロードの場合
    if (typeof options == "undefined") {
      options = { bgm_over: "false",
                  is_awakegame: "false"//@@awakegameで戻って来たかを判定する属性を追加。
                  };
    } else if (typeof options.bgm_over == "undefined") {
      options["bgm_over"] = "false";
      options["is_awakegame"] = "false";//@@awakegameで戻って来たかを判定する属性を追加。
    }

        // [wait]中にロードされた場合の対策
        clearTimeout(this.kag.tmp.wait_id);
        this.kag.tmp.wait_id = "";
        this.kag.stat.is_wait = false;

    /**
     * make.ks を通過してもとの場所に戻ってきたときに次のタグに進むかどうかを制御する文字列。
     * 通常はもちろん "no" (進まない) だが、タグを進めるべきケースがいくつかある。
     *
     * 1. オートセーブデータをロードした場合
     * 2. [showmenu] で開いたセーブメニューからセーブしたデータをロードした場合
     * 3. [wait] 中にセーブしたデータを読み込んだ場合
     *
     * 3.は通常ではありえないが、一応考慮。
     */
    var auto_next = "no";
    if (options.auto_next) {
      auto_next = options.auto_next;
    }

    // Live2Dモデルがある場合の後始末
    if (typeof Live2Dcanvas != "undefined") {
      for (let model_id in Live2Dcanvas) {
        if (Live2Dcanvas[model_id]) {
          Live2Dcanvas[model_id].check_delete = 2;
          Live2D.deleteBuffer(Live2Dcanvas[model_id].modelno);
          delete Live2Dcanvas[model_id];
        }
      }
    }

    // BGMを引き継がないタイプのロード(通常のロード)の場合、
    // いま再生されているすべてのBGMとSEを止める
    if (options.bgm_over == "false") {
      // 全BGM停止
      var map_bgm = this.kag.tmp.map_bgm;
      for (let key in map_bgm) {
        this.kag.ftag.startTag("stopbgm", {
          stop: "true",
          buf: key,
        });
      }

      // 全SE停止
      var map_se = this.kag.tmp.map_se;
      for (let key in map_se) {
        if (map_se[key]) {
          this.kag.ftag.startTag("stopse", {
            stop: "true",
            buf: key,
          });
        }
      }
    }

    //
    // レイヤー構造(DOM)の復元
    //

    this.kag.layer.setLayerHtml(data.layer);

    // グラデーションテキストの復元
    $(".gradient-text").restoreGradientText();

    // 一時要素をすべて削除
    $(".temp-element").remove();

    //バックログの初期化
    //awakegame考慮もれ。一旦戻す
    //this.kag.variable.tf.system.backlog = [];

    //
    // ステータスの更新
    //

        //ロールバックからの呼び出しの場合
        if (options.is_rollback == true) {
            const tmp_checkpoint = this.kag.stat.checkpoint;
            data.stat.checkpoint = tmp_checkpoint;
        }

    this.kag.stat = data.stat;

    // [s] で止まっているセーブデータを読み込んだ場合はロード後次のタグに進めるべきではない
    if (this.kag.stat.is_strong_stop) {
      auto_next = "stop";
    }

    // [wait] で止まっているデータを読み込んだ場合(通常ありえない)はロード後次のタグに進めるべきだ
    if (this.kag.stat.is_wait) {
      auto_next = "yes";
    }

    //タイトルの復元
    this.kag.setTitle(this.kag.stat.title);

    // BGMを引き継がないタイプのロード(通常のロード)の場合、
    // さっきすべてのBGMとSEを止めてしまったから、
    // 現在のステータスに記憶されているBGMとループSEを改めて再生する
    if (options.bgm_over == "false") {
      // BGM
      if (this.kag.stat.current_bgm != "") {
        var mstorage = this.kag.stat.current_bgm;

        var pm = {
          loop: "true",
          storage: mstorage,
          html5: this.kag.stat.current_bgm_html5,
          stop: "true",
          can_ignore: "false",
        };

        //ボリュームが設定されいる場合
        if (this.kag.stat.current_bgm_vol != "") {
          pm["volume"] = this.kag.stat.current_bgm_vol;
        }

        if (this.kag.stat.current_bgm_pause_seek != "") {
          pm["pause"] = "true";
          pm["seek"] = this.kag.stat.current_bgm_pause_seek;
        }

        if (this.kag.stat.current_bgm_base64 != "") {
          pm["base64"] = this.kag.stat.current_bgm_base64;
        }

        this.kag.ftag.startTag("playbgm", pm);


      }

      // ループSE
      for (const key in this.kag.stat.current_se) {
        var pm_obj = this.kag.stat.current_se[key];
        pm_obj.can_ignore = "false";
        pm_obj["stop"] = "true";
        this.kag.ftag.startTag("playbgm", pm_obj);
      }

    }

    //読み込んだCSSがある場合
    $("head").find("._tyrano_cssload_tag").remove();
    if (this.kag.stat.cssload) {
      for (let file in this.kag.stat.cssload) {
        var style =
          '<link class="_tyrano_cssload_tag" rel="stylesheet" href="' +
          $.escapeHTML(file) +
          "?" +
          Math.floor(Math.random() * 10000000) +
          '">';
        const j_style = $(style);
        $("head link:last").after(j_style);
        if (this.kag.config["keyFocusWithHoverStyle"] === "true") {
          j_style.on("load", () => {
            $.copyHoverCSSToFocusCSS(j_style);
          });
        }
      }
    } else {
      this.kag.stat.cssload = {};
    }

    if (!this.kag.stat.current_bgmovie) {
      this.kag.stat.current_bgmovie = {
        storage: "",
        volume: "",
      };
    }

    //カメラ設定を復旧 ///////////////
    if (this.kag.config.useCamera == "true") {
      $(".layer_camera").css({
        "-animation-name": "",
        "-animation-duration": "",
        "-animation-play-state": "",
        "-animation-delay": "",
        "-animation-iteration-count": "",
        "-animation-direction": "",
        "-animation-fill-mode": "",
        "-animation-timing-function": "",
      });

      for (let key in this.kag.stat.current_camera) {
        var a3d_define = {
          frames: {
            "0%": {
              trans: this.kag.stat.current_camera[key],
            },
            "100%": {
              trans: this.kag.stat.current_camera[key],
            },
          },

          config: {
            duration: "5ms",
            state: "running",
            easing: "ease",
          },

          complete: function () {
            //特に処理なし
          },
        };

        //アニメーションの実行
        if (key == "layer_camera") {

          $(".layer_camera").css("-webkit-transform-origin", "center center");
          (function (_a3d_define) {
            setTimeout(function () {
              $(".layer_camera").a3d(a3d_define);
            }, 1);
          })(a3d_define);

        } else {

          $("." + key + "_fore").css("-webkit-transform-origin", "center center");
          (function (_a3d_define) {
            setTimeout(function () {
              $("." + key + "_fore").a3d(_a3d_define);
            }, 1);
          })(a3d_define);

        }
      }
    }
    ///////////カメラここまで

    //どの道動画削除。
    $(".tyrano_base").find("video").remove();
    this.kag.tmp.video_playing = false;

    //背景動画が設定中なら
    if (this.kag.stat.current_bgmovie["storage"] != "") {
      const vstorage = this.kag.stat.current_bgmovie["storage"];
      const volume = this.kag.stat.current_bgmovie["volume"];
      const pm = {
        storage: vstorage,
        volume: volume,
        stop: "true",
      };
      this.kag.tmp.video_playing = false;
      this.kag.ftag.startTag("bgmovie", pm);
    }

    //カメラが設定中なら
    if (this.kag.stat.current_bgcamera != "") {
      this.kag.stat.current_bgcamera["stop"] = "true";
      this.kag.ftag.startTag("bgcamera", this.kag.stat.current_bgcamera);
    }

    //3Dモデルの復元/////////////////////////////////////////////
    var three = data.three;
    if (three.stat.is_load == true) {
      this.kag.stronglyStop();
      var init_pm = three.stat.init_pm;

      this.kag.ftag.startTag("3d_close", {});

      //setTimeout((e)=>{

      init_pm["next"] = "false";
      this.kag.ftag.startTag("3d_init", init_pm);

      var models = three.models;

      var scene_pm = three.stat.scene_pm;
      scene_pm["next"] = "false";

      this.kag.ftag.startTag("3d_scene", scene_pm);

      for (var key in models) {
        const model = models[key];
        const pm = model.pm;

        pm["pos"] = model.pos;
        pm["rot"] = model.rot;
        pm["scale"] = model.scale;
        pm["_load"] = "true";

        var tag = pm._tag;

        if (key == "camera") {
          tag = "3d_camera";
        }

        pm["next"] = "false";

        this.kag.ftag.startTag(tag, pm);
      }

      //ジャイロの復元
      var gyro = three.stat.gyro;
      if (gyro.enable == 1) {
        //復活させる。
        var gyro_pm = gyro.pm;
        gyro_pm["next"] = "false";
        this.kag.ftag.startTag("3d_gyro", gyro_pm);
      }

      if (three.stat.canvas_show) {
        this.kag.tmp.three.j_canvas.show();
      } else {
        this.kag.tmp.three.j_canvas.hide();
      }

      this.kag.tmp.three.stat = three.stat;
      this.kag.tmp.three.evt = three.evt;

      //イベントが再開できるかどうか。

      this.kag.cancelStrongStop();

      //},10);
    }

    /////////////////////////////////////////////

    //カーソルの復元
    this.kag.getTag("cursor").restore();

    //フォーカスの復元
    this.kag.restoreFocusable();

    //クリック待ちグリフの復元
    this.kag.ftag.restoreNextImg();

    //メニューボタンの状態
    if (this.kag.stat.visible_menu_button == true) {
      $(".button_menu").show();
    } else {
      $(".button_menu").hide();
    }

    //イベントの復元
    $(".event-setting-element").each(function () {
      var j_elm = $(this);
      var tag_name = j_elm.attr("data-event-tag");
      var pm = JSON.parse(j_elm.attr("data-event-pm"));
      that.kag.getTag(tag_name).setEvent(j_elm, pm);
    });

    //
    // プロパティの初期化
    //

    // 一時変数(tf)は消す
    // ※ this.kag.tmp に影響はない
    this.kag.clearTmpVariable();


    
    // ロード直後なのだから、セーブ時の状態がどうであったにせよいまはアニメーションスタック数はゼロであるべき
    // ウェイト状態やトランス待機状態であるはずもない
    this.kag.tmp.num_anim = 0;
    this.kag.stat.is_wait = false;
    this.kag.stat.is_stop = false;


    //
    // make.ksを通過してからもとのシナリオファイル＋タグインデックスに戻る処理
    //

    const next = () => {
      // ティラノイベント"load-beforemaking"を発火
      this.kag.trigger("load-beforemaking");

      // make.ks を挿入する
      const insert = {
        name: "call",
        pm: {
          storage: "make.ks",
          auto_next: auto_next,
        },
        val: "",
      };
      //@@start
      //ロード時にそのセーブデータのバックログを読む(awakegameは除く)
      if(options.is_awakegame=="false"){
        //console.warn("バックログを読み込みました");
        this.kag.variable.tf.system.backlog = this.kag.stat.f.backlog;
        tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile  = TYRANO.kag.stat.f.saveFile;
        //console.warn("f.backlogを空にしました");
        TYRANO.kag.stat.f.saveFile = []; //f変数の方は消す
        }
      //@@end
            
      this.kag.ftag.nextOrderWithIndex(data.current_order_index, data.stat.current_scenario, true, insert, "yes");



    };

    // make.ks に行く前にプリロードをする必要があるものはこの配列にぶち込んでいく
    const preload_targets = [];

    // [xanim]用に読み込んだ<svg>の復元
    if (this.kag.stat.hidden_svg_list) {
      const j_hidden_area = this.kag.getHiddenArea();
      for (const item of this.kag.stat.hidden_svg_list) {
        switch (typeof item) {
          case "string": {
            const file_path = item;
            // すでに存在しているならスキップ
            if (document.getElementById(file_path)) {
              // $("#" + item) だとjQueryがセレクタの構文エラーを吐いてくるので pure javascript を使う
              continue;
            }
            // 存在していない！
            preload_targets.push((callback) => {
              $.get(file_path, (xml) => {
                $(xml).find("svg").attr("id", file_path).appendTo(j_hidden_area);
                callback();
              });
            });
            break;
          }
        }
      }
    }

    // [xanim]の無限ループアニメーションの復元
    const restoreXanim = () => {
      // [xanim]の復元対象
      $(".set-xanim-restore").each(function () {
        const j_this = $(this);
        const pm = JSON.parse(j_this.attr("data-event-pm"));
        const initial_css_map = JSON.parse(j_this.attr("data-effect"));
        j_this.css(initial_css_map);
        pm.delay = "0";
        pm.next = "false";
        that.kag.getTag("xanim").start(pm);
      });
    };

    // プリロードが必要ないなら即実行
    if (preload_targets.length === 0) {
      restoreXanim();
      next();
      return;
    }

    // あと何個プリロードする必要があるか
    // プリロードが完了するたびにデクリメント、これが0になったらプリロード完了
    let preload_targets_count_left = preload_targets.length;

    // プリロード1個完了処理
    const complete_preload_one = () => {
      preload_targets_count_left -= 1;
      if (preload_targets_count_left === 0) {
        // console.warn("complete preload!");
        restoreXanim();
        next();
      }
    };

    // プリロード開始
    for (const item of preload_targets) {
      switch (typeof item) {
        case "function":
          item(complete_preload_one);
          break;
        case "string":
          this.kag.preload(item, complete_preload_one);
          break;
      }
    }

    //ジャンプ
    //data.stat.current_scenario;
    //data.current_order_index;
    //必ず、ファイルロード。別シナリオ経由的な
    //this.kag.ftag.startTag("call",{storage:"make.ks"});

    //auto_next 一旦makeを経由するときに、auto_nextを考えておく
    //alert(auto_next);

    //auto_next = "yes";

    //make.ks を廃止したい
    //var insert =undefined;
  };

  /********************************************
 * ↑ tyrano.plugin.kag.menu.loadGameData
 *********************************************/
  /**********************************************
 * ↓ tyrano.plugin.kag.tag.awakegame
 *********************************************/

  /*
#[awakegame]

:group
マクロ・分岐・サブルーチン関連

:title
ゲームの一時停止からの復帰

:exp
`[sleepgame]`タグで保存されたゲームの状態に復帰します。

ジャンプ先でゲーム変数を操作した場合、その内容は復帰後に反映されます。

セーブデータをロードするときと同様に、ゲームの復帰時には`make.ks`を通過します。休止中の操作に対してなんらかの特別な処理を実行したい場合、`make.ks`でゲーム変数などを使って`[awakegame]`からの復帰かどうかの判定をいれるとよいでしょう。

:sample

:param
variable_over = `true`または`false`を指定します。`true`を指定すると、`[sleepgame]`中のゲーム変数の変更を復帰後に引き継ぎます。,
bgm_over      = `true`または`false`を指定します。`true`を指定すると、`[sleepgame]`中のBGMを復帰後に引き継ぎます。

:demo
2,kaisetsu/09_sleepgame

#[end]
*/

tyrano.plugin.kag.tag.awakegame = {
  vital: [],

  pm: {
      variable_over: "true", // f変数を引き継ぐか
      sound_opt_over: "true", // stat の map_se_volume, map_bgm_volume を引き継ぐか
      bgm_over: "true",
  },

  start: function (pm) {
      var that = this;

      if (this.kag.tmp.sleep_game == null) {
          //this.kag.error("保存されたゲームがありません。[awakegame]タグは無効です");
          //データがない場合はそのまま次の命令へ
          this.kag.ftag.nextOrder();
      } else {
          var sleep_data = this.kag.tmp.sleep_game;

          //f変数を継承する
          if (pm.variable_over == "true") {
              sleep_data.stat.f = this.kag.stat.f;
          }

          if (pm.sound_opt_over === "true") {
              sleep_data.stat.map_se_volume = this.kag.stat.map_se_volume;
              sleep_data.stat.map_bgm_volume = this.kag.stat.map_bgm_volume;
          }

          var options = {
              bgm_over: pm.bgm_over,
              is_awakegame: "true",//@@awakegameによって呼ばれていることがわかるようにオプションを追加。
          };
          

          if (this.kag.tmp.sleep_game_next == true) {
              options["auto_next"] = "yes";
          }

          this.kag.menu.loadGameData($.extend(true, {}, sleep_data), options);

          this.kag.tmp.sleep_game = null;
      }
  },
};
/**********************************************
 * ↑ tyrano.plugin.kag.tag.awakegame 
 *********************************************/

  /**********************************************
 * ↓ tyrano.plugin.kag.menu.displayLog  
 *********************************************/
  //バックログ画面表示
  tyrano.plugin.kag.menu.displayLog = function () {
    var that = this;
    that.kag.unfocus();
    this.kag.setSkip(false);

    var j_save = $("<div></div>");

    this.kag.html(
      "backlog",
      {
        novel: $.novel,
      },
      function (html_str) {
        var j_menu = $(html_str);

        var layer_menu = that.kag.layer.getMenuLayer();
        layer_menu.empty();
        layer_menu.append(j_menu);

        that.setMenuCloseEvent(layer_menu);
        that.setHoverEvent(layer_menu);

        that.setMenuScrollEvents(j_menu, { target: ".log_body", move: 60 });

        // スマホのタッチ操作でスクロールできるようにするために touchmove の伝搬を切る
        // (document まで伝搬するとそこのリスナで e.preventDefault() が呼ばれるため)
        j_menu.find(".log_body").on("touchmove", (e) => {
          e.stopPropagation();
        });

        var log_str = "";
        var pendingMarker = "";

        //バックログ全文をarray_logに入れる
        var array_log = that.kag.variable.tf.system.backlog;
        for (var i = 0, j = 0; i < array_log.length; i++) {
          //@@start
            //displayをblockに変更しているので、divで囲む。
            if (array_log[i].indexOf('class="blj_text') !== -1) {
              pendingMarker = array_log[i];
              continue;
            }

            if (pendingMarker) {
              log_str += `<div><span class="blj_marker">${pendingMarker}</span><span class="blj_content">${array_log[i]}</span></div>`;
              pendingMarker = "";
            } else {
              log_str += `<div>${array_log[i]}</div>`;
            }
          //@@end
        }

        if (pendingMarker) {
          log_str += `<div><span class="blj_marker">${pendingMarker}</span></div>`;
        }

        layer_menu.find(".log_body").html(log_str);

        layer_menu.find(".log_body").css("font-family", that.kag.config.userFace);

        $.preloadImgCallback(
          layer_menu,
          function () {
            layer_menu.stop(true, true).fadeIn(300);
            //一番下固定させる
            layer_menu.find(".log_body").scrollTop(9999999999);
          },
          that,
        );

        $(".button_menu").hide();




        //追加箇所start------------------------------------------------
        //マウスオンの箇所をハイライト
        //@@start
          //対象クラスをbacklog_text → blj_textに変更
          $(".blj_text").hover(
          //@@end
            function () {
              $(this).css("background-color", "rgba(0, 0, 255, 0.1)");
            },
            function () {
              $(this).css("background-color", "rgba(255, 255, 255, 0)");
            }
          );

        //マウスクリックでジャンプ
          //@@対象クラスをbacklog_text → blj_textに変更
          $(".blj_text").click((e) => {
            //console.log(e.target.className);
            //backlogSerialNumberの中身を取得
            let backlogSerialNumber = e.target.className.replace("blj_text", "");
          if (tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile.length < 0) {
            //console.log("バックログがないにも関わらずバックログジャンプを実行しようとしました。");//ないとは思うけど一応
            return;
          }

        //@@バックログジャンプ実行関数
        const do_blj = () => {
          //ロード処理
           $('.menu_close').trigger('click');
            
            //@@start
                blj_index=-1; //ジャンプするセーブデータのインデックスを格納する変数

                /*
                backlogSerialNumber（クリックしたテキストに付与されている番号）
                と同じ値のf.blj_numbrが格納されているセーブデータを探す処理。
                
                ※※※
                f.blj_numberは、[n]タグを踏む度に値が1増える。被ることはない。
                また、バックログにテキストが挿入される際には、
                そのテキストに「現在のf.blj_number」と同じ値のbacklogSerialNumberが付与される。
                したがって、データがズレる（クリックしたテキストと違うデータに飛ぶ）ことはない。
                ※※※
                */
                for (let i = 0; i < tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile.length; i++){
                  //一致するデータを見つけたら、そのデータのインデックスを取得して終了
                  if(tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[i].stat.f.blj_number == backlogSerialNumber)
                  {
                    blj_index=i;
                    break;
                  }
                }
                

              //ロード失敗処理
              //blj_index==-1(初期値から変わっていない)
              // ということは、合致するセーブデータがなかったということなのでreturn。
                if(blj_index==-1){
                  alert("対象のセーブデータが見つかりませんでした");
                  return;
                }

                const currentMessage = tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[blj_index].stat.current_message_str; //現在のメッセージを代入。ロード後にログに入れる

                //ジャンプ先のセーブデータがスキップモード中であるかどうかで処理が変わる
                if(tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[blj_index].stat.is_skip == true){
                tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[blj_index].stat.is_skip = false;
                that.kag.setSkip(false);
                that.loadGameData($.extend(true, {}, tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[blj_index]), { auto_next: "yes", bgm_over: "false" }, false);
                //that.kag.setSkip(false);
                }else{
                  //スキップモードがOFFの場合は、ジャンプ直後に表示されているメッセージがバックログから消えてしまう。
                  that.kag.setSkip(false);
                  that.loadGameData($.extend(true, {}, tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile[blj_index]), { auto_next: "yes", bgm_over: "false" }, false);
                  that.kag.ftag.nextOrder();
                  //that.kag.setSkip(false);
                }
              


                //ロード時にそのセーブデータのバックログを読む
                //console.warn("バックログを読み込みました");
                TYRANO.kag.variable.tf.system.backlog = TYRANO.kag.stat.f.backlog;
                //console.warn("f.backlogを空にしました");
                TYRANO.kag.stat.f.backlog = []; //f変数は消す
                
                //バックログジャンプを挿入する。
                /*
                ※※※
                [blj_record_start]や[n]はセーブしてからバックログジャンプボタンを挿入するので、
                ジャンプするとジャンプボタンが1つ足りなくなっている。
                だから、こういう仕様にしないとうまくいかない……はず。
                ※※※
                */
                const markerHtml = `<span class="blj_text ${TYRANO.kag.stat.f.blj_number}"></span>`;
                let markerInserted = false;
                const backlogArray = TYRANO.kag.variable.tf.system.backlog;
                if (currentMessage && Array.isArray(backlogArray) && backlogArray.length > 0) {
                  const lastIndex = backlogArray.length - 1;
                  if (backlogArray[lastIndex] === currentMessage) {
                    backlogArray.splice(lastIndex, 0, markerHtml);
                    markerInserted = true;
                  }
                }
                if (!markerInserted) {
                  TYRANO.kag.ftag.startTag("pushlog",
                    {text: markerHtml,
                    join: false});
                }
                
                //戻った分のセーブデータを消す
                for(let i=Number(tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile.length);i > Number(blj_index)+1; i--){
                  tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile.pop();
                }



        };

      //@@ 確認ダイアログを表示するか分岐する処理
      switch(TYRANO.kag.variable.sf.blj.confirmMode){
        case 0:
          //ティラノ独自のダイアログを表示
          $(".remodal").find("#remodal-confirm").html(TYRANO.kag.variable.sf.blj.confirmOK);
          $(".remodal").find("#remodal-cancel").html(TYRANO.kag.variable.sf.blj.confirmCancel);
          $.confirm(
              TYRANO.kag.variable.sf.blj.confirmText,
              function () {
                do_blj();
                return;
              },
              function () {
                return false;
              },
          );
          break;
        case 1:
          //javascript標準のダイアログを表示
          if (confirm(String(TYRANO.kag.variable.sf.blj.confirmText))) {
            do_blj();
            return;
         
          }
          break;
        default:
          //確認をすっ飛ばして実行
          do_blj();

      };


        });
        //追加箇所end------------------------------------------------
      },
    );
  };

  /**********************************************
 * ↑ tyrano.plugin.kag.menu.displayLog  
 *********************************************/

/**********************************************
 * ↓ tyrano.plugin.kag.menu.doSave 
 *********************************************/
//@@オリジナル関数を保存。
let _doSave= tyrano.plugin.kag.menu.doSave;

//セーブを実行する
  tyrano.plugin.kag.menu.doSave = function (num, cb) {
 
    //@@バックログの中身をセーブデータに保存する。
    this.kag.stat.f.backlog = this.kag.variable.tf.system.backlog;

    //@@バックログジャンプ用のセーブファイルの配列もセーブデータに保存する。
    this.kag.stat.f.saveFile = tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile;
    
    //@@元の関数を呼び出す。
    _doSave.apply(this,arguments);

    //f.saveFileを消す
    this.kag.stat.f.backlog=[]
    this.kag.stat.f.saveFile=[]

  }
/**********************************************
 * ↑ tyrano.plugin.kag.menu.doSave 
 *********************************************/
/**********************************************
 * ↓ [savesnap]
 *********************************************/

//[savesnap]
//セーブスナップの保存
tyrano.plugin.kag.tag.savesnap = {
  vital: ["title"],

  pm: {
      title: "",
      //@@start
      //flag_thumb: サムネイルを保存するか。デフォルトはconfigのconfigThumbnailに従う。
      flag_thumb: "",
      //@@end
  },

  
  //@@start
  //送る属性にflag_thumを追加。
  start: function (pm) {
      var that = this;
      this.kag.menu.snapSave(pm.title, function () {
          that.kag.ftag.nextOrder();
      }, pm.flag_thumb);
  },
  //@@end
};

//@@start
//[savesnap]上書き処理
tyrano.plugin.kag.ftag.master_tag.savesnap = tyrano.plugin.kag.tag.savesnap;
tyrano.plugin.kag.ftag.master_tag.savesnap.kag = _kag;
//@@end


/**********************************************
 * ↑ [savesnap] 
 *********************************************/


/**********************************************
 * ↓ tyrano.plugin.kag.menu.snapSave 
 *********************************************/
let _snapSave=tyrano.plugin.kag.menu.snapSave;
  //セーブ状態のスナップを保存します。
  tyrano.plugin.kag.menu.snapSave = function (title, call_back, flag_thumb) {
   
  //@@start
      //バックログの中身をセーブデータに保存する。
      this.kag.stat.f.backlog = this.kag.variable.tf.system.backlog;

      if (typeof flag_thumb == "undefined") {
        flag_thumb = this.kag.config.configThumbnail;
      }

      //flag_thumがfalseならオリジナルの関数を呼んでreturn
      if(flag_thumb=="true")
        {
          _snapSave.apply(this,arguments);
          return;
        }
  //@@end
    
    // ティラノイベント"snapsave-start"を発火
    var that = this;
    this.kag.trigger("snapsave-start");

    //画面のキャプチャも取るよ
    var _current_order_index = that.kag.ftag.current_order_index - 1;
    var _stat = $.extend(true, {}, $.cloneObject(that.kag.stat));

    //3Dオブジェクトが実装されてる場合復元させる。////////////////////

    var three = this.kag.tmp.three;
    var models = three.models;

    var three_save = {};

    three_save.stat = three.stat;
    three_save.evt = three.evt;

    var save_models = {};

    for (var key in models) {
      var model = models[key];
      save_models[key] = model.toSaveObj();
    }

    three_save.models = save_models;
    
    /////////////////////////////////////////////////////////////

        // [anim wait="false"]中のセーブ対策
        // アニメーションを強制的に完了させる
        $(".tyrano-anim").each(function () {
            $(this).stop(true, true);
        });

        // [chara_mod wait="false"]中のセーブ対策
        // 表情変更中にセーブが実行された場合は表情変更を強制的に完了させる
        $(".chara-mod-animation").each(function () {
            const j_old = $(this);
            const j_new = j_old.next();
            j_old.remove();
            j_new.stop(true, true);
        });


    if (flag_thumb == "false") {
      //
      // サムネイルデータを作成しない場合
      //
      //console.log("debug: flag_thumbがfalseのためサムネイルデータを作成しませんでした");
      var img_code = "";
      var data = {};

      data.title = $(title).text();
      data.stat = _stat;
      data.three = three_save;
      data.current_order_index = _current_order_index;
      //１つ前
      data.save_date = that.getDateStr();
      data.img_data = img_code;

      //レイヤ部分のHTMLを取得
      var layer_obj = that.kag.layer.getLayeyHtml();
      data.layer = layer_obj;

      that.snap = $.extend(true, {}, $.cloneObject(data));

      //追加箇所start------------------------------------------------
      if (title === "backlogJump") {
        tyrano.plugin.kag.tmp.BackLoght.backlogJump.pushSaveFile(that.snap);
      }
      //追加箇所end------------------------------------------------
      if (call_back) {
        call_back();

        // ティラノイベント"snapsave-complete"を発火
        that.kag.trigger("snapsave-complete");
      }
    } else {
      var thumb_scale = this.kag.config.configThumbnailScale || 1;
      if (thumb_scale < 0.01) thumb_scale = 0.01;
      if (thumb_scale > 1) thumb_scale = 1;

      $("#tyrano_base").find(".layer_blend_mode").css("display", "none");

      setTimeout(function () {
        //
        // キャプチャ完了時コールバック
        //
        var completeImage = function (img_code) {
          var data = {};

          data.title = $(title).text();
          data.stat = _stat;
          data.three = three_save;

          data.current_order_index = _current_order_index;
          //１つ前
          data.save_date = that.getDateStr();
          data.img_data = img_code;

          //レイヤ部分のHTMLを取得
          var layer_obj = that.kag.layer.getLayeyHtml();
          data.layer = layer_obj;

          that.snap = $.extend(true, {}, $.cloneObject(data));
          //追加箇所start------------------------------------------------
          if (title === "backlogJump") {
            tyrano.plugin.kag.tmp.BackLoght.backlogJump.pushSaveFile(that.snap);
          }
          //追加箇所end------------------------------------------------	
          if (call_back) {
            call_back();

            // ティラノイベント"snapsave-complete"を発火
            that.kag.trigger("snapsave-complete");
          }

          that.kag.hideLoadingLog();
        };

        if (that.kag.stat.save_img != "") {
          //
          // サムネイルに使う画像が[save_img]タグで直接指定されている場合
          //

          var img = new Image();
          img.src = _stat.save_img;
          img.onload = function () {
            var canvas = document.createElement("canvas");
            canvas.width = that.kag.config.scWidth * thumb_scale;
            canvas.height = that.kag.config.scHeight * thumb_scale;
            // Draw Image
            var ctx = canvas.getContext("2d");
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
            // To Base64
            var img_code = that.createImgCode(canvas);

            completeImage(img_code);
          };
        } else{
          //
          // html2canvas.jsでゲーム画面のキャプチャを実行する場合
          //

          that.kag.showLoadingLog("save");

          //ビデオをキャプチャするための仕組み
          let canvas = document.createElement("canvas"); // declare a canvas element in your html
          let ctx = canvas.getContext("2d");
          let videos = document.querySelectorAll("video");
          let w, h;
          for (let i = 0, len = videos.length; i < len; i++) {
            const v = videos[i];
            //if (!v.src) continue // no video here
            try {
              w = v.videoWidth;
              h = v.videoHeight;

              canvas.style.left = v.style.left;
              canvas.style.top = v.style.top;

              canvas.style.width = v.style.width;
              canvas.style.height = v.style.height;

              canvas.width = w;
              canvas.height = h;

              ctx.fillRect(0, 0, w, h);
              ctx.drawImage(v, 0, 0, w, h);
              v.style.backgroundImage = `url(${canvas.toDataURL()})`; // here is the magic
              v.style.backgroundSize = "cover";
              v.classList.add("tmp_video_canvas");

              ctx.clearRect(0, 0, w, h); // clean the canvas
            } catch (e) {
              continue;
            }
          }

          //canvasがある場合は、オリジナルをクローン。画面サイズによっては、カクつく問題が残る
          var flag_canvas = false;
          var array_canvas = [];
          $("#tyrano_base")
            .find("canvas")
            .each(function (index, element) {
              array_canvas.push(element);
            });
          if (array_canvas.length > 0) {
            flag_canvas = true;
          }

          var tmp_base;

          //canvasがある場合。
          if (flag_canvas) {
            tmp_base = $("#tyrano_base");
          } else {
            tmp_base = $("#tyrano_base").clone();
            tmp_base.addClass("snap_tmp_base");
            $("body").append(tmp_base);
          }

          var tmp_left = tmp_base.css("left");
          var tmp_top = tmp_base.css("top");
          var tmp_trans = tmp_base.css("transform");

          tmp_base.css("left", 0);
          tmp_base.css("top", 0);
          tmp_base.css("transform", "");
          tmp_base.find(".layer_menu").hide();

          var opt = {
            scale: thumb_scale,
            height: that.kag.config.scHeight,
            width: that.kag.config.scWidth,
            logging: that.kag.config["debugMenu.visible"] === "true",
          };

          html2canvas(tmp_base.get(0), opt).then(function (canvas) {
            $("#tyrano_base").find(".layer_blend_mode").css("display", "");
            $("#tyrano_base").find(".tmp_video_canvas").css("backgroundImage", "");

            // キャプチャした画像をDOMに追加してクオリティチェック
            // コメントトグル:  ⌘ + /  または  Ctrl + /
            // $("body").css({
            //     overflow: "scroll",
            // });
            // $(canvas)
            //     .css({
            //         position: "absolute",
            //         top: $.getViewPort().height,
            //     })
            //     .appendTo("body");
            // console.log(canvas)
            var img_code = that.createImgCode(canvas);

            completeImage(img_code);
          });

          tmp_base.hide();

          tmp_base.css("left", tmp_left);
          tmp_base.css("top", tmp_top);
          tmp_base.css("transform", tmp_trans);
          tmp_base.find(".layer_menu").show();
          $("body").find(".snap_tmp_base").remove();

          tmp_base.show();
        }
      }, 20);
    }
  };
  /**********************************************
 * ↑ tyrano.plugin.kag.menu.snapSave 
 *********************************************/
  /**********************************************
 * ↓ tyrano.plugin.kag.menu.setQuickSave 
 *********************************************/
  let _setQuickSave = tyrano.plugin.kag.menu.setQuickSave;
  tyrano.plugin.kag.menu.setQuickSave = function () {
    //@@start
      //バックログとセーブファイルを保存する。
      this.kag.stat.f.backlog = this.kag.variable.tf.system.backlog;
      this.kag.stat.f.saveFile = tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile;
      //元の関数を呼び出す。
      _setQuickSave.apply(this,arguments);
      //処理終了後にf.backlogは空にしておく
      this.kag.stat.f.backlog=[];
      this.kag.stat.f.saveFile = [];
    //@@end

}
  /**********************************************
 * ↑ tyrano.plugin.kag.menu.setQuickSave
 *********************************************/
  let _doSetAutoSave = tyrano.plugin.kag.menu.doSetAutoSave;
  tyrano.plugin.kag.menu.doSetAutoSave = function () {
      //バックログとセーブファイルを保存する。
      this.kag.stat.f.backlog = this.kag.variable.tf.system.backlog;
      this.kag.stat.f.saveFile = tyrano.plugin.kag.tmp.BackLoght.backlogJump.saveFile;
      //元の関数を呼び出す。
      _doSetAutoSave.apply(this,arguments); 
      //処理終了後にf.backlogは空にしておく
      this.kag.stat.f.backlog=[];
      this.kag.stat.f.saveFile = [];
  }



}());
