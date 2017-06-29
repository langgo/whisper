if (typeof Object.assign !== 'function') {
  alert('upgrade your browser, please.')
}

(function (global, $) {
  const dev = true;
  let config = {
    // your website's title
    title: 'whisper',

    index: 'index',
    sidebar: 'sidebar.md',
    readme: 'README.md',

    github_url: '',

    ids: {
      content_id: "#content",
      sidebar_id: "#sidebar",
      back_to_top_id: "#back_to_top",
      loading_id: "#loading",
      error_id: "#error",
    },

    switchs: {
      sidebar: true,
      edit_button: true,
      on_back_to_top_button: true,
      save_progress: true, // 保存阅读进度
      search_bar: true,
    },
  };

  let menu = [];
  let init_sidebar_ing = false;

  global.whisper = {};
  global.whisper.run = function (cfg) {
    // 初始化配置
    Object.assign(config, cfg);
    Object.assign(config.ids, cfg.ids);
    Object.assign(config.switchs, cfg.switchs);

    dev && global.console.log(`[whisper] config:`, config);

    // init
    init_delegate();

    // 初始化 sidebar
    init_sidebar_section();
  };

  function init_delegate () {
    /*
     search
     */

    $(global).bind('add_sidebar', function () {
      let search = `
      <div class="searchBox">
        <input name="search" type="search">
        <img class="searchButton" src="assets/img/magnifier.jpg" alt="Search">
      </div>`;

      $(config.ids.sidebar_id).find('h2').first().before($(search));
    });


    let search = function () {
      let $searchBox = $('.searchBox');
      let q = $searchBox.find('input[name=search]').val();
      if (q !== '') {
        let url = config.github_url + '/search?utf8=✓&q=' + encodeURIComponent(q);
        global.open(url, '_blank');
        global.focus();
      }
    };

    // 初始化搜索框提交
    $(global.document).delegate('.searchButton', 'click', function () {
      if (config.github_url === '') {
        alert(`Error! You didn't set 'github_url' when calling whisper()!`);
        return
      }

      search();

      return false;
    });

    $(global).on('keydown', function (event) {
      switch (event.keyCode) {
        case 13:
          search();
          break;
      }
    });

    /*
     page up
     page down
     */

    if (menu.length > 0) {
      // pageup event
      $(global).delegate('#pageup', 'click', function () {
        let hash = getHash().nav;
        dev && global.console.log(`[whisper] init_delegate. pageup event, hash:`, hash);

        if (hash === '') return;

        for (let i = 0; i < menu.length; i++) {
          if (menu[i] === '#' + hash) break;
        }

        global.location.hash = menu[i - 1]
      });

      // pagedonw event
      $(global).delegate('#pagedown', 'click', function () {
        let hash = getHash().nav;
        dev && global.console.log(`[whisper] init_delegate. pagedown event, hash:`, hash);

        if (hash === '') return;

        for (let i = 0; i < menu.length; i++) {
          if (menu[i] === '#' + hash) break;
        }

        global.location.hash = menu[i + 1];
      });
    }
  }

  function init_sidebar_section (dir) {
    init_sidebar_ing = true;

    dir = dir || getHash().dir || config.index;
    let sidebar_file = dir + '/' + config.sidebar;

    dev && global.console.log(`[whisper] init_sidebar_section. sidebar_file:`, sidebar_file);

    if (sidebar_file.split('.').pop() !== 'md') {
      global.alert(`[whisper] init_sidebar_section. not a md`);
      return
    }

    $.get(sidebar_file, function (data) {
      dev && global.console.log(`[whisper] init_sidebar_section. sidebar_file data:`, data);

      $(config.ids.sidebar_id).html(marked(data));

      // 触发 add_sidebar
      $(window).trigger('add_sidebar');

      // 初始化内容数组
      nemu = [];
      let menuOL = $(config.ids.sidebar_id).find('ol');
      menuOL.find('li a').map(function () {
        menu.push(this.href.slice(this.href.indexOf('#')));
      });

      dev && global.console.log(`[whisper] init_sidebar_section. menu:`, menu);

      init_sidebar_ing = false;
    }, "text").fail(function () {
      alert("Opps! can't find the sidebar file to display!");
      init_sidebar_ing = false;
    });
  }


  /**
   * 获取当前hash
   *
   * @param {string} hash 要解析的hash，默认取当前页面的hash，如： nav#类目 => {nav:nav, anchor:类目}
   * @description 分导航和页面锚点
   * @return {Object} {nav:导航, anchor:页面锚点}
   */
  function getHash (hash) {
    hash = hash || window.location.hash;
    if (!hash) {
      return {
        dir: config.index,
        nav: config.index,
        anchor: ''
      }
    }

    let hashs = hash.split('#');
    let dir = '';
    if (hashs[1].endsWith('.md')) {
      dir = hashs[1].split('/').slice(0, -1).join('/')
    }

    return {
      dir: dir,
      nav: hashs[1],
      anchor: decodeURIComponent(hashs[2] || '')
    }
  }

  /**
   * scroll to $ele 位置，动画持续 ms
   *
   * @param $ele
   * @param ms
   */
  function scrollTo ($ele, ms) {
    if ($ele.constructor !== $) {
      $ele = $($ele)
    }
    ms = ms || 300;

    $('html, body').animate({
      scrollTop: $ele.offset().top
    }, ms)
  }
})(window, $);

/*
 文件 or 目录
 */