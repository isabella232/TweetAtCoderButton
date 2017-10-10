// ==UserScript==
// @name         LatestAtCoderTweet
// @namespace    https://twitter.com/lumac_
// @version      1.2
// @description  Tweet latest contest record with this button!
// @author       Luma
// @match        http://atcoder.jp/user/*
// @match        https://beta.atcoder.jp/users/*
// @grant        none
// ==/UserScript==

/**
https://twitter.com/intent/tweet?original_referer=####url####&text=####text####
 */

// 煩雑なコード
// ブックマークレットに対応
// AtCoderに破壊的な仕様変更がないように祈ります
(function () {
  'use strict';
  const runSoon = window && window.__runSoon; // ブックマークレット検知
  const buttonID = "__tweet_atcoder_button";
  const executed = !!$("#" + buttonID).length;
  const url = location.href.replace(/\/$/, "");
  const userName = url.replace(/.*users?\/([^/]+)(\/history)?/, "$1");
  const names = ["date", "standing", "perf.", "rate"];
  const btnDiv = $(`<div>`).attr("id", buttonID);
  const btn = $(`<a class="btn btn-info" target="_blank"><span class="glyphicon glyphicon-share"></span> 最新の記録をツイート</a>`);
  btnDiv.append(btn);

  if (url.match(/^https?:\/\/atcoder\.jp\/user\/[^/]+\/?$/)) { // ユーザーページ
    setupFromUser($(".dl-horizontal").eq(1));
  } else if (url.match(/^https?:\/\/beta\.atcoder\.jp\/users\/[^/]+\/?$/)) { // ユーザーページ beta
    setupFromUser($(".dl-table").eq(1));
  } else if (url.match(/^https?:\/\/(beta\.)?atcoder\.jp\/users?\/[^/]+\/history$/)) { // ヒストリーページ
    setupFromHistory();
  }
  // それ以外はブックマークレットのために無視
  //

  function makeUrl($el) {
    const tbody = $el.find("#history tbody");
    const trss = Array.from(
      tbody.find("tr")
    );

    // 最新のコンテストを計算

    const allContest =
      trss
        .map(e =>
          Array.from($(e).find("td")).map(e => e.innerText.trim())
        )
        .map(e =>
          (e[0] = new Date(e[0]), e)
        );

    allContest.sort((a, b) => a[0].getTime() - b[0].getTime());

    // 最新のコンテストが判明

    const latest = allContest[allContest.length - 1];
    const rated = latest[5] !== "-";
    const contestName = latest[1];

    const basicData = [].concat(latest);
    basicData.length = 4;
    basicData.splice(1, 1);
    if (!rated) basicData.length = 2; // 非rated なら perf.を除く
    basicData[0] = format(basicData[0]);
    const basicStr = basicData.map((e, i) => names[i] + " : " + e).join("\n");

    const rates = Array.from(tbody.find("tr")).map(e => $(e).find("td").eq(4)[0].innerText.trim())
      .filter(e => e.match(/\d+/)) // 数値のみ // e!=="-"
      .map(e => +e); // 数値型へ（比較するので?）

    const highest = rates.reduce((a, b) => Math.max(a, b), 0);

    const highestCount = rates.reduce((a, b) => a + (b === highest ? 1 : 0), 0);

    const rateStr = names[3] + " : "
      + latest[4]
      + " (" + latest[5] + ")"
      + (highest === +latest[4] && highestCount === 1 ? " highest!!" : "");

    const tweet = contestName + "\n"
      + userName + "\n"
      + basicStr + "\n"
      + (!rated ? "" : rateStr + "\n");

    const twiUrl = "https://twitter.com/intent/tweet?original_referer=" + url
      + "&text="
      + encodeURIComponent(tweet);
    return twiUrl;
  }

  function getAsync() {
    return get().then(data => {
      return makeUrl($(data.replace(/^[\s\S]*(<html>)/, "$1"))); // <!DOCTYPE 除去
    });
  }

  function get() {
    return new Promise((resolve, reject) => {
      $.get(url + "/history", {}, data => resolve(data));
    });
  }

  function setupFromUser($el) {
    getAsync()
      .then(url => {
        if (runSoon) {
          window.open(url, "_blank");
        }

        if (!executed) {
          $el.append(btnDiv);
          btn.attr("href", url);
        }
      });
  }

  function setupFromHistory() {
    const url = makeUrl($(document));
    if (runSoon) {
      window.open(url, "_blank");
    }
    if (!executed) {
      $("h2").eq(0).append(btnDiv);
      btn.attr("href", url);
    }
  }

  function format(date) {
    return date.getFullYear() + "/"
      // ゼロ埋め
      + ("0" + (date.getMonth() + 1)).slice(-2) + "/"
      + ("0" + date.getDate()).slice(-2)
      + " ("
      // 曜日
      + (["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"])[date.getDay()]
      + ")";
  }
})();
