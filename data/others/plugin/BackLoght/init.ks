[loadjs storage="./plugin/BackLoght/main.js"]

[loadcss file="./data/others/plugin/BackLoght/style.css"]

@iscript


//各種コンフィグ
sf.blj = {
  
  //◆バックログジャンプボタンとして挿入する文字列
  //htmlタグを使うことで画像なども挿入可能です
  //default: "↪"
  pushtext:"↪",
  
  //◆バックログジャンプで戻れるメッセージの数。
  //デフォルトはconfig.tjsのバックログ上限の設定に合わせます。
  //default: tyrano.plugin.kag.config.maxBackLogNum
  maxSaveFileNum: tyrano.plugin.kag.config.maxBackLogNum,

  //◆バックログジャンプする際に出す確認ダイアログの文字
  //default: "この位置にジャンプしますか？"
  confirmText: "この位置にジャンプしますか？"

  
}



//コンフィグここまで
@endscript



;マクロ定義、ここから先は触らない！

;[blj_record_start]
@macro name="blj_record_start"
@iscript
  f=TYRANO.kag.stat.f;//一応定義
  let blj_number = 0;//バックログジャンプ用シリアルナンバー（連番）
  if (typeof f.blj_number === "undefined" || isNaN(f.blj_number)||f.blj_number==tyrano.plugin.kag.config.maxBackLogNum) {
    f.blj_number = 0;
  }
  let w_count = 0;//wを踏んだ回数
    if (typeof f.w_count === "undefined" || isNaN(f.w_count)) {
    f.w_count = 0;
  }
  this.kag.pushBackLog(`<span class="blj_text ${Number(f.blj_number)}">${sf.blj.pushtext}</span>`, "add");
  f.is_blj_record=true;
  f.saveFile=[];

@endscript
  [savesnap title="backlogJump" flag_thumb="false"]
  [wait time="10" cond="!TYRANO.kag.stat.is_skip"]
@endmacro

;[blj_record_stop]
@macro name="blj_record_stop"
@eval exp="f.is_blj_record=false"
@endmacro

;[n]
[macro name="n"]
  ;[wait time="10" cond="!TYRANO.kag.stat.is_skip"]
  [eval exp="f.w_count=0"]
  [p]
  [if exp="f.is_blj_record"]
    [wait time="10" cond="!TYRANO.kag.stat.is_skip"]
    [eval exp="f.saveFile=[]"]
    [iscript]
            f=TYRANO.kag.stat.f;//一応定義
            f.blj_number += 1;
            this.kag.pushBackLog(`<span class="blj_text ${Number(f.blj_number)}">${sf.blj.pushtext}</span>`, "add");
    [endscript]
    [savesnap title="backlogJump" flag_thumb="false"]
    [wait time="10" cond="!TYRANO.kag.stat.is_skip"]
  [endif]

[endmacro]


@return

