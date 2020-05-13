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
/*global define, require */

define(["dojo/_base/declare",
        "deploy/widgets/scripts/ScriptEditorDialog"],

function(declare,
        ScriptEditorDialog) {
    return declare('deploy.widgets.scripts.PostScriptEditorDialog', [ScriptEditorDialog], {

        postCreate: function() {
            if (!this.script && this.source) {
                this.script = {body: this.source.body};
            }
            this.script = this.script || {body: 'var exit = properties.get(\'exitCode\');\n\n' +
                'scanner.register("regex", function(lineNumber, line) {\n' +
                '     var thing = \'do stuff\';\n' +
                '});\n\n' +
                'if (exit == 0) {\n' +
                '    properties.put(\'Status\', \'Success\');\n' +
                '}\n' +
                'else {\n' +
                '     properties.put(\'Status\', \'Failure\');\n' +
                '}\n'};

           this.description = i18n("Specify the post processing script to be run here(JavaScript).<br/> You will have" +
                " access to the output properties from the step in a java.util.Properties " +
                "variable name <b>properties</b>. <br>The properties will have a special property for" +
                " the exit code of the process called <b>exitCode</b>.<br/>It will also have a special" +
                " property for the final status called <b>Status</b>. A status of <b>Success</b> is the" +
                " only status that wont result in the step failing. <br/>There will also" +
                " be a variable called <b>scanner</b> " +
                "which can be used to scan the output log of the step. It has these public " +
                "methods:  <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;register(String regex, function call) -> this will register a new" +
                " function to be called whenever the regex is matched. <br/>" +
                "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;addLOI(Integer lineNumber) -> this will add a specific line to the lines " +
                " of interest list. These will be highlighted in the LogViewer after the " +
                " process has finished. This is implicitly called anytime the scanner " +
                " matches a line. <br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;getLinesOfInterest() -> this will return a " +
                "java.util.List<Integer> that is the list of lines of interest. This can be" +
                " used for removing lines when necessary.<br/>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;scan() -> this tells the scanner" +
                " to go ahead and scan the log. Should be invoked after all regexs are registered.");

           this.language= "javascript";

           this.inherited(arguments);
        }
    });
});
