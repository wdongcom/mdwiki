(function($) {
    'use strict';
    // call the gimmick
    $.mdbootstrap = function (method){
        if ($.mdbootstrap.publicMethods[method]) {
            return $.mdbootstrap.publicMethods[method].apply(this, Array.prototype.slice.call(arguments, 1));
        } else {
            $.error('Method ' + method + ' does not exist on jquery.mdbootstrap');
        }
    };
    // simple wrapper around $().bind
    $.mdbootstrap.events = [];
    $.mdbootstrap.bind =  function (ev, func) {
        $(document).bind (ev, func);
        $.mdbootstrap.events.push (ev);
    };
    $.mdbootstrap.trigger = function (ev) {
        $(document).trigger (ev);
    };

    var navStyle = '';

    // PUBLIC API functions that are exposed
    var publicMethods = {
        bootstrapify: function () {
            createPageSkeleton();
            buildMenu ();
            changeHeading();
            replaceImageParagraphs();

            $('table').addClass('table').addClass('table-bordered');
            //pullRightBumper ();

            // remove the margin for headings h1 and h2 that are the first
            // on page
            //if (navStyle == "sub" || (navStyle == "top" && $('#md-title').text ().trim ().length === 0))
            //    $(".md-first-heading").css ("margin-top", "0");

            // external content should run after gimmicks were run
            $.md.stage('postgimmick').subscribe(function(done) {
                adjustExternalContent();
                highlightActiveLink();

                /*if ($.md.config.useSideMenu === true) {
                    createPageContentMenu();
                }*/
                done();
            });
        }
    };
    // register the public API functions
    $.mdbootstrap.publicMethods = $.extend ({}, $.mdbootstrap.publicMethods, publicMethods);

    // PRIVATE FUNCTIONS:

    function buildTopNav() {
        // replace with the navbar skeleton
        if ($('#md-menu').length <= 0) {
            return;
        }
        navStyle = 'top';
        var $menuContent = $('#md-menu').children();

        $('#md-menu').addClass ('navbar navbar-fixed-top');
        var menusrc = '';
        menusrc += '<div class="navbar-inner">';
        menusrc += '<div id="md-menu-inner" class="container">';
        menusrc += '<ul id="md-menu-ul" class="nav">';
        menusrc += '</ul></div></div>';

        var $bootstrapmenu  = $(menusrc);
        $bootstrapmenu.appendTo('#md-menu');
        $('#md-menu-ul').append($menuContent);

        // the menu should be the first element in the body
        $('#md-menu-container').prependTo ('#md-all');

        // then comes md-title, and afterwards md-content
        // offset md-title to account for the fixed menu space
        // 50px is the menu width + 20px spacing until first text
        // or heading
        $('#md-body').css('margin-top', '70px');
    }
    function buildSubNav() {
        // replace with the navbar skeleton
        /* BROKEN CODE
        if ($('#md-menu').length <= 0) {
            return;
        }
        navStyle = 'sub';
        var $menuContent = $('#md-menu').html ();

        var menusrc = '';
        menusrc += '<div id="md-menu-inner" class="subnav">';
        menusrc += '<ul id="md-menu-ul" class="nav nav-pills">';
        menusrc += $menuContent;
        menusrc += '</ul></div>';
        $('#md-menu').empty();
        $('#md-menu').wrapInner($(menusrc));
        $('#md-menu').addClass ('span12');

        $('#md-menu-container').insertAfter ($('#md-title-container'));
        */
    }

    function buildMenu () {
        if ($('#md-menu a').length === 0) {
            return;
        }
        var h = $('#md-menu');

        // make toplevel <a> a dropdown
        h.find('> a[href=""]')
            .attr('data-toggle', 'dropdown')
            .addClass('dropdown-toggle')
            .attr('href','')
            .append('<b class="caret"/>');
        h.find('ul').addClass('dropdown-menu');
        h.find('ul li').addClass('dropdown');

        // replace hr with dividers
        $('#md-menu hr').each(function(i,e) {
            var hr = $(e);
            var prev = hr.prev();
            var next = hr.next();
            if (prev.is('ul') && prev.length >= 0) {
                prev.append($('<li class="divider"/>'));
                hr.remove();
                if (next.is('ul')) {
                    next.find('li').appendTo(prev);
                    next.remove();
                }
                // next ul should now be empty
            }
            return;
        });

        // remove empty uls
        $('#md-menu ul').each(function(i,e) {
            var ul = $(e);
            if (ul.find('li').length === 0) {
                ul.remove();
            }
        });

        $('#md-menu hr').replaceWith($('<li class="divider-vertical"/>'));

        $('#md-menu h1').replaceWith(function() {
            var brand = $('<a class="brand"/>').text($(this).text());
            return brand;
        });

        // wrap the toplevel links in <li>
        $('#md-menu > a').wrap('<li />');
        $('#md-menu ul').each(function(i,e) {
            var ul = $(e);
            ul.appendTo(ul.prev());
            ul.parent('li').addClass('dropdown');
        });

        // call the user specifed menu function
        buildTopNav();
    }
    function isVisibleInViewport(e) {
        var el = $(e);
        var top = $(window).scrollTop();
        var bottom = top + $(window).height();

        var eltop = el.offset().top;
        var elbottom = eltop + el.height();

        return (elbottom <= bottom) && (eltop >= top);
    }

    function createPageContentMenu () {
        $(window).scroll(function() {
            var $first;
            $('*.md-inpage-anchor').each(function(i,e) {
                if ($first === undefined) {
                    var h = $(e);
                    if (isVisibleInViewport(h)) {
                        $first = h;
                    }
                }
            });
            // highlight in the right menu
            $('#md-page-menu a').each(function(i,e) {
                var $a = $(e);
                if ($a.text() === $first.text()) {
                    $('#md-page-menu li.active').removeClass('active');
                    $a.parent('li').addClass('active');
                }
            });
        });

        // assemble the menu
        var $headings = $('#md-content').find('h1,h2,h3');

        var affixDiv = $('<div id="md-page-menu" />');

        //var top_spacing = $('#md-menu').height() + 15;
        var top_spacing = 70;
        affixDiv.affix({
            //offset: affix.position() - 50,
            offset: 130
        });
        affixDiv.css('top', top_spacing);
        //affix.css('top','-250px');

        var $ul = $('<ul style="width: 200px" class="nav nav-tabs nav-stacked"/>');
        affixDiv.append($ul);

        $headings.each(function(i,e) {
            var $heading = $(e);
            var $li = $('<li/>');
            var $a = $('<a />');
            $a.attr('href', $heading.text());
            $a.click(function(ev) {
                ev.preventDefault();

                var $this = $(this);
                $.md.scrollToInPageAnchor($this.text());
            });
            $a.text($heading.text());
            $li.append($a);
            $ul.append($li);
        });

        //menu.css('width','100%');
        $('#md-right-column').append(affixDiv);
    }

    function createPageSkeleton() {

        $('#md-title').wrap('<div class="container" id="md-title-container"/>');
        $('#md-title').wrap('<div class="row-fluid" id="md-title-row"/>');

        $('#md-menu').wrap('<div class="container" id="md-menu-container"/>');
        $('#md-menu').wrap('<div class="row-fluid" id="md-menu-row"/>');

        $('#md-content').wrap('<div class="container" id="md-content-container"/>');
        $('#md-content').wrap('<div class="row-fluid" id="md-content-row"/>');

        $('#md-body').wrap('<div class="container" id="md-body-container"/>');
        $('#md-body').wrap('<div class="row-fluid" id="md-body-row"/>');

        $('#md-content').addClass('span10');
        $('#md-title').addClass('span10');

        $('#md-content-row').append('<div class="span2" id="md-right-column"/>');
    }
    function pullRightBumper (){
 /*     $("span.bumper").each (function () {
			$this = $(this);
			$this.prev().addClass ("pull-right");
		});
*/
		$('span.bumper').addClass ('pull-right');
    }

    function changeHeading() {

        // HEADING
        var jumbo = $('<div class="jumbotron page-header" />');
        var heading = $('<h1/>');
        heading.text($('#md_title').text());
        jumbo.append(heading);
        $('#md-title').wrapInner(jumbo);
    }

    function highlightActiveLink () {
        // when no menu is used, return
        if ($('#md-menu').find ('li').length === 0) {
            return;
        }
		var filename = $.md.mainHref;

		if (filename.length === 0) {
            filename = 'index.md';
        }
		var selector = 'li:has(a[href$="' + filename + '"])';
		$('#md-menu').find (selector).addClass ('active');
    }

    // replace all <p> around images with a <div class="thumbnail" >
    function replaceImageParagraphs() {

        // only select those paragraphs that have images in them
        var $pars = $('p img').parents('p');
        $pars.each(function() {
            var $p = $(this);
            var $images = $(this).find('img')
                .filter(function() {
                    // only select those images that have no parent anchor
                    return $(this).parents('a').length === 0;
                })
                // add those anchors including images
                .add($(this).find ('a:has(img)'))
                .addClass('thumbnail');

            // create a new url group at the fron of the paragraph
            $p.prepend($('<ul class="thumbnails" />'));
            // move the images to the newly created ul
            $p.find('ul').eq(0).append($images);

            // wrap each image with a <li> that limits their space
            // the number of images in a paragraphs determines thei width / span
            // FLOATS disabled for now
            if (false && $p.hasClass ('md-floatenv')) {
                // float environments have smaller sizes for images
                if ($images.length === 1) {
                    $images.wrap('<li class="span6" />');
                } else if ($images.length === 2) {
                    $images.wrap('<li class="span3" />');
                } else {
                    $images.wrap('<li class="span2" />') ;
                }
            } else {
                // non-float => images are on their own single paragraph, make em larger
                // but remember, our image resizing will make them only as large as they are
                // but do no upscaling
                if ($images.length === 1) {
                    $images.wrap('<li class="span10" />');

                } else if ($images.length === 2) {
                    $images.wrap('<li class="span5" />');
                } else {
                    $images.wrap('<li class="span3" />');
                }
            }
            // finally, every img gets its own wrapping thumbnail div
            //$images.wrap('<div class="thumbnail" />');
        });
        // apply float to the ul thumbnails
        $('.md-floatenv.md-float-left ul').addClass ('pull-left');
        $('.md-floatenv.md-float-right ul').addClass ('pull-right');
    }

    function adjustExternalContent() {
        // external content are usually iframes or divs that are integrated
        // by gimmicks
        // example: youtube iframes, google maps div canvas
        // all external content are in the md-external class

        $('iframe.md-external').not ('.md-external-nowidth')
            .attr('width', '450')
            .css ('width', '450px');

        $('iframe.md-external').not ('.md-external-noheight')
            .attr('height', '280')
            .css ('height', '280px');

        // make it appear like an image thumbnal
        $('.md-external').addClass('thumbnail');

        //.wrap($("<ul class='thumbnails' />")).wrap($("<li class='span6' />"));
        $('div.md-external').not('.md-external-noheight')
            .css('height', '280px');
        $('div.md-external').not('.md-external-nowidth')
            .css('width', '450px');

        // // make it appear like an image thumbnal
        // $("div.md-external").addClass("thumbnail").wrap($("<ul class='thumbnails' />")).wrap($("<li class='span10' />"));

        // $("div.md-external-large").css('width', "700px")
    }

}(jQuery));
