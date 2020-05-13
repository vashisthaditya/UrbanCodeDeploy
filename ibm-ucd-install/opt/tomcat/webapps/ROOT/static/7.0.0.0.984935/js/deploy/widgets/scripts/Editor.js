/*
* Licensed Materials - Property of IBM* and/or HCL**
* UrbanCode Deploy
* (c) Copyright IBM Corporation 2011, 2017. All Rights Reserved.
* (c) Copyright HCL Technologies Ltd. 2018. All Rights Reserved.
*
* U.S. Government Users Restricted Rights - Use, duplication or disclosure restricted by
* GSA ADP Schedule Contract with IBM Corp.
*
* * Trademark of International Business Machines
* ** Trademark of HCL Technologies Limited
*/
/*global define, require, ace:false */

define([
        "dijit/_TemplatedMixin",
        "dijit/_Widget",
        "dojo/_base/declare",
        "dojo/dom-construct",
        "dojo/on"
        ],
function(
        _TemplatedMixin,
        _Widget,
        declare,
        domConstruct,
        on
) {
    /*
     * A widget that contains a code editor
     *
     * This widget will need its startup() function explicitly called. This is
     * best done in the parent widget's 'startup()' function.
     *
     *
     * Supported Properties:
     *
     *  language / String                        - Required -
     *                                           The programming language to use
     *                                           for syntax highlighting. Available
     *                                           options are below.
     *
     *  fontSize / integer                       - Optional - Default: 12
     *                                           The font size to use in the editor.
     *
     *  syntaxCheck / bool                       - Optional - Default: false
     *                                           The flag that determines whether or
     *                                           not to use the editor's syntax checker
     *                                           and display warnings in the editor.
     *
     *  existingValue / String                   - Optional - Default: ''
     *                                           The value to populate the editor
     *                                           with upon widget creation.
     *
     *  colorTheme / String                      - Optional - Default: 'chrome'
     *                                           The color theme for the editor to
     *                                           use. Available options are below.
     *
     *  hasToolbar / bool                        - Optional - Default: false
     *                                           The flag to turn create the editor
     *                                           with or without a toolbar that contains
     *                                           options for the editor. i.e. font size
     *
     *
     * Available languages:
     *   abap, actionscript, ada, asciidoc, assembly_x86, autohotkey, batchfile, c9search,
     *   c_cpp, clojure, cobol, coffee, coldfusion, csharp, css, curly, d, dart, diff,
     *   django, dot, ejs, erlang, forth, ftl, flsl, golang, groovy, haml, handlebars,
     *   haskell, haxe, html, html_completions, html_ruby, ini, jack, jade, java, javascript,
     *   json, jsoniq, jsp, jsx, julia, latex, less, liquid, lisp, livescript, logiql, lsl,
     *   lua, luapage, lucene, makefile, markdown, matlab, mushcode, mushcode_high_rules,
     *   mysql, nix, objectivec, ocaml, pascal, perl, pgsql, php, plain_text, powershell,
     *   prolog, properties, protobuf, python, r, rdoc, rhtml, ruby, rust, sass, scad, scala,
     *   scheme, scss, sh, sjs, snippets, soy_template, space, sql, stylus, svg, tcl, tex,
     *   text, textfile, toml, twig, typescript, vbscript, velocity, verilog, vhdl, xml,
     *   xquery, yaml
     *
     * Available themes:
     *   ambiance, chaos, chrome, clouds, clouds_midnight, cobalt, crimson_editor, dawn,
     *   dreamweaver, eclipse, github, ide_fingers, kr, merbivore, merbivore_soft,
     *   mono_industrial, monokai, pastel_on_dark, solarized_dark, solarized_light, terminal,
     *   textmate, tomorrow, tomorrow_night, tomorrow_night_blue, tomorrow_night_bright,
     *   tomorrow_night_eighties, twilight, vibrant_ink, xcode
     *
     */
    return declare('deploy.widgets.scripts.Editor', [_Widget, _TemplatedMixin], {
        templateString:
        '<div class="codeEditor">' +
            '<div data-dojo-attach-point="toolbarAttach"></div>' +
            '<div data-dojo-attach-point="editorAttach"></div>' +
        '</div>',

        editorId: null,
        language: null,
        syntaxCheck: false,

        _notInitializedMessage: 'Editor not initialized! Did you call startup() ?',

        /**
         *
         */
        postCreate: function() {
            this.inherited(arguments);
            this.editorId = Math.random().toString(36).slice(2);

            this.editorDiv = domConstruct.create('div', {
                'id': this.editorId,
                'class': 'editor'
            }, this.editorAttach);
        },

        /**
         *
         */
        startup: function() {
            this.inherited(arguments);

            // This expects the div with id 'editor' to already be created
            this.editor = ace.edit(this.editorId);


            // adjust editor settings...

            this.setLanguage(this.language);

            if (this.existingValue) {
                this.setValue(this.existingValue);
            }

            // Turn off syntax checker by default
            this.setSyntaxChecker(this.syntaxCheck || false);

            if (this.colorTheme) {
                this.setColorTheme(this.colorTheme);
            }

            if (this.fontSize) {
                this.setFontSize(this.fontSize);
            }

            if (this.hasToolbar) {
                throw 'TODO'; // TODO
            }
        },

        /**
         *
         */
        destroy: function() {
            this.editor.destroy();
        },

        /**
         *
         */
        setColorTheme: function(colorTheme) {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            this.editor.setTheme('ace/theme/' + colorTheme);
        },

        /**
         *
         */
        isSyntaxCheckerOn: function() {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            return this.editor.getSession().getUseWorker();
        },

        /**
         *
         */
        setSyntaxChecker: function(value) {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            return this.editor.getSession().setUseWorker(value);
        },

        /**
         *
         */
        setFontSize: function(size) {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            this.editor.setFontSize(size);
        },

        /**
         *
         */
        getLanguage: function() {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            return this.lang || "javascript";
        },

        /**
         *
         */
        setLanguage: function(lang) {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            this.lang = lang;
            this.editor.getSession().setMode('ace/mode/' + lang);
        },

        /**
         *
         */
        setValue: function(value) {
            if (!this.editor) {
                throw this._notInitializedMessage;
            }
            this.editor.setValue(value, -1);
        },

        /**
         *
         */
        getValue: function() {
            if (!this.editor) {
                if (this.value !== undefined) {
                    return this.value;
                }
                throw this._notInitializedMessage;
            }
            return this.editor.getValue();
        },

        /**
         *
         */
        get: function(value) {
            var result;
            if (value === 'value') {
                result = this.getValue();
            }
            else {
                result = this.inherited(arguments);
            }
            return result;
        }
    });
});