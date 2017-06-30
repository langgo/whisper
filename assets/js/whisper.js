if (typeof Object.assign !== 'function') {
  alert('upgrade your browser, please.')
}

(function (global, $) {
  const dev = true;
  const log = global.console.log;

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
      back_to_top_button: true,
      save_progress: true, // 保存阅读进度
      search_bar: true,
    },
  };

  const disqusCode = '<h3>留言</h3><div id="disqus_thread"></div>';

  global.whisper = {};
  global.whisper.run = function run (cfg) {
    // 初始化配置
    Object.assign(config, cfg);
    Object.assign(config.ids, cfg.ids);
    Object.assign(config.switchs, cfg.switchs);

    dev && log(`[whisper] config:`, config);

    // init
    init_delegate();

    if (config.switchs.back_to_top_button) {
      init_back_to_top_button()
    }

    init_page();
  };

  function init_delegate () {
    /*
     搜索框
     */

    let search = function () {
      //
      let search = `
      <div class="searchBox">
        <input name="search" type="search">
        <img class="searchButton" src="assets/img/magnifier.jpg" alt="Search">
      </div>`;

      $(config.ids.sidebar_id).find('h2').first().before($(search));
    };
    $(global).bind('add_sidebar', search);

    let searchButton = function () {
      if (config.github_url === '') {
        alert(`Error! You didn't set 'github_url' when calling whisper()!`);
        return
      }

      let $searchBox = $('.searchBox');
      let q = $searchBox.find('input[name=search]').val();
      if (q !== '') {
        let url = config.github_url + '/search?utf8=✓&q=' + encodeURIComponent(q);
        global.open(url, '_blank');
        global.focus();
      }
    };

    $(global.document).delegate('.searchButton', 'click', searchButton);
    $(global).on('keydown', function (event) {
      switch (event.keyCode) {
        case 13:
          searchButton();
          break;
      }
    });
  }

  function init_sidebar_section (dir) {
    init_sidebar_ing = true;

    dir = dir || getHash().dir;
    let sidebar_file = dir + '/' + config.sidebar;

    dev && log(`[whisper] init_sidebar_section. sidebar_file:`, sidebar_file);

    if (sidebar_file.split('.').pop() !== 'md') {
      global.alert(`[whisper] init_sidebar_section. not a md`);
      return
    }

    $.get(sidebar_file, function (data) {
      dev && log(`[whisper] init_sidebar_section. sidebar_file data.length:`, data.length);

      $(config.ids.sidebar_id).html(marked(data));

      // 触发 add_sidebar
      $(window).trigger('add_sidebar');

      init_sidebar_ing = false;
    }, "text").fail(function () {
      alert("Opps! can't find the sidebar file to display!");
      init_sidebar_ing = false;
    });
  }

  function init_back_to_top_button () {
    let $backToTop = $(config.ids.back_to_top_id);
    $backToTop.show();
    $backToTop.on('click', scrollTo('body'));
  }

// TODO 菜单栏 激活状态

  function init_page (dir) {
    dir = dir || config.index;

    let sidebarFile = dir + '/' + config.sidebar;
    init_sidebar(sidebarFile);

    let readmeFile = dir + '/' + config.readme;
    init_content(readmeFile);

    $(window).on('hashchange', function () {
      let hash = getHash();
      dev && log(`[whisper] init_page. hashchange event, hash`, hash);

      if (hash.is_file) {
        init_content(hash.file);
      } else {
        init_page(hash.dir, hash.anchor);
      }
    })
  }

  function init_sidebar (sidebarFile) {
    dev && log(`[whisper] init_sidebar_section. sidebar_file:`, sidebarFile);

    if (sidebarFile.split('.').pop() !== 'md') {
      global.alert(`[whisper] init_sidebar_section. not a md`);
      return
    }

    $.get(sidebarFile, function (data) {
      dev && log(`[whisper] init_sidebar_section. sidebar_file data.length:`, data.length);

      $(config.ids.sidebar_id).html(marked(data));

      // 触发 add_sidebar
      $(window).trigger('add_sidebar');
    }, "text").fail(function () {
      alert("Opps! can't find the sidebar file to display!");
    });
  }

  function init_content (file, anchor) {
    if (config.switchs.save_progress && store.get('menu-progress') !== file) {
      global.store.set('menu-progress', file);
      global.store.set('page-progress', 0);
    }

    const $global = $(global);
    const $error = $(config.ids.error_id);
    const $content = $(config.ids.content_id);

    $global.off('scroll');

    let loading = show_loading();

    $.get(file, function (data) {
      $error.hide();
      $content.html(marked(data) + disqusCode);

      let title = $content.find('h1').text();
      global.document.title = title ? `${title} - ${config.title}` : config.title;

      // TODO
      // normalize_paths(); // 链接 和 图片地址

      create_page_anchors();

      // 完成代码高亮
      $content.find('code').map(function () {
        Prism.highlightElement(this);
      });

      // 加载disqus TODO

      let perc = config.switchs.save_progress ? global.store.get('page-progress') || 0 : 0;
      if (anchor) {
        scrollTo($('#' + decodeURI(anchor)))
      } else if (perc === 0 || perc === '0') {
        scrollTo(null, null, $content.offset().top + 10);
        scrollTo(null, null, $content.offset().top);
      } else {
        // todo
        scrollTo(null, null, ($('body').height() - $(global).height()) * perc)
      }

      (function () {
        let $global = $(global);
        let $prog2 = $('.progress-indicator-2');
        let wh = $global.height();
        let bh = $('body').height();
        let sHeight = bh - wh;

        $global.on('scroll', function () {
          global.requestAnimationFrame(function () {
            let perc = Math.max(0, Math.min(1, $global.scrollTop() / sHeight));
            updateProgress(perc);
          });
        });

        function updateProgress (perc) {
          $prog2.css({ width: perc * 100 + '%' });
          config.switchs.save_progress && store.set('page-progress', perc);
        }
      }());


    }).fail(function () {
      show_error();
    }).always(function () {
      clearInterval(loading);
      $(config.ids.loading_id).hide();
    });
  }

  function normalize_paths () {
    // images
    $(config.ids.content_id + " img").map(function () {
      let src = $(this).attr("src").replace("./", "");
      if ($(this).attr("src").slice(0, 4) !== "http") {
        let pathname = location.pathname.substr(0, location.pathname.length - 1);
        let url = location.hash.replace("#", "");

        // split and extract base dir
        url = url.split("/");
        let base_dir = url.slice(0, url.length - 1).toString();

        // normalize the path (i.e. make it absolute)
        $(this).attr("src", pathname + base_dir + "/" + src);
      }
    });
  }

  function create_page_anchors () {
    // create page anchors by matching li's to headers
    // if there is a match, create click listeners
    // and scroll to relevant sections

    // go through header level 1 to 3
    let $content = $(config.ids.content_id);
    for (let i = 2; i <= 4; i++) {
      // parse all headers
      let headers = [];
      $content.find('h' + i).map(function () {
        let $this = $(this);

        let content = $this.text();
        headers.push(content);

        $this.addClass(replace_symbols(content));
        $this.on('hover', function () {

          let h2 = '#' + global.location.hash.split('#')[1];
          let h1 = h2 + '#' + replace_symbols(content);
          $this.html(
            content +
            `<a href="${h1}" class="section-link">§</a>
             <a href="${h2}" onclick="goTop()">⇧</a>`
          );
        }, function () {
          $this.html(content);
        });

        $this.on('click', 'a.section-link', function (event) {
          event.preventDefault();

          history.pushState(null, null, '#' + location.hash.split('#')[1] + '#' + replace_symbols(content));
          goSection(replace_symbols(content));
        });
      });

      if ((i === 2) && headers.length !== 0) {
        let ul_tag = $('<ol></ol>')
          .insertAfter('#content h1')
          .addClass('content-toc')
          .attr('id', 'content-toc');
        for (let j = 0; j < headers.length; j++) {
          let li_tag = $('<li></li>').html('<a href="#' + location.hash.split('#')[1] + '#' + headers[j] + '">' + headers[j] + '</a>');
          ul_tag.append(li_tag);
          li_create_linkage(li_tag, i);
        }
      }
    }
  }

  function replace_symbols (text) {
    // replace symbols with underscore
    return text
      .replace(/, /g, ',')
      .replace(/[&\/\\#,.+=$~%'":*?<>{}\ \]\[]/g, "-")
      .replace(/[()]/g, '');
  }

  function li_create_linkage (li_tag, header_level) {
    // add custom id and class attributes
    html_safe_tag = replace_symbols(li_tag.text());
    li_tag.attr('data-src', html_safe_tag);
    li_tag.attr("class", "link");

    // add click listener - on click scroll to relevant header section
    li_tag.click(function (e) {
      e.preventDefault();
      // scroll to relevant section
      let header = $(
        ditto.content_id + " h" + header_level + "." + li_tag.attr('data-src')
      );
      $('html, body').animate({
        scrollTop: header.offset().top
      }, 200);

      // highlight the relevant section
      original_color = header.css("color");
      header.animate({ color: "#ED1C24", }, 500, function () {
        // revert back to orig color
        $(this).animate({ color: original_color }, 2500);
      });
      history.pushState(null, null, '#' + location.hash.split('#')[1] + '#' + li_tag.attr('data-src'));
    });
  }

  function show_error () {
    $(config.ids.error_id).show();
  }

  function show_loading () {
    $(config.ids.content_id).html(''); // clear content
    $(config.ids.loading_id).show(); // infinite loop until clearInterval() is called on loading

    return setInterval(function () {
      $(config.ids.loading_id).fadeIn(1000).fadeOut(1000);
    }, 2000);
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
        is_file: false,
        dir: config.index,
        file: config.index,
        anchor: ''
      }
    }

    let hashs = hash.split('#');
    let is_file = hashs[1].endsWith('.md');

    let dir = hashs[1];
    if (is_file) {
      dir = hashs[1].split('/').slice(0, -1).join('/')
    }

    return {
      is_file,
      dir: dir || config.index,
      file: dir === '' ? config.index + '/' + hashs[1] : hashs[1],
      anchor: decodeURIComponent(hashs[2] || '')
    }
  }


  const $body = $('body');

  function scrollTo ($ele, ms, offset) {
    if (offset === undefined && $ele.constructor !== $) {
      $ele = $($ele)
    }
    ms = ms || 300;

    $body.animate({
      scrollTop: offset === undefined ? $ele.offset().top : offset
    }, ms)
  }
})(window, $);