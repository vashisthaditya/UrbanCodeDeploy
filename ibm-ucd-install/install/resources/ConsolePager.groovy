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
import java.io.FileDescriptor;
import java.io.FileOutputStream;
import java.io.PrintStream;

public class ConsolePager {

    //*************************************************************************
    //
    //*************************************************************************

    /**
     * Test pager by providing a file to display
     * @param args
     */
    static public void main(String[] args) {
        def c = new ConsolePager();
        c.init();
        c.printText(new File(args[0]).text);
    }

    //*************************************************************************
    //
    //*************************************************************************

    // Because this installer is called through ant, we need to use the original
    // file descriptor because ant has overridden system.out such that it will
    // not properly show UTF-8 output.
    def out = new PrintStream(new FileOutputStream(FileDescriptor.out), true,
            System.getProperty("file.encoding"));

    final def isWindows = (System.getProperty('os.name') =~ /(?i)windows/).find()
    Integer rows = null
    Integer  cols = null
    boolean java6 = false;
    boolean doPause = true;

    public ConsolePager() {
    }

    public void init() {
        def resizeOut = exec(["resize"])
        def sttyOut = exec(["stty", "size"]).tokenize()
        // def winModeOut = exec(["mode"]) // provides buffer size, not window :-(

        // detect if on a jre below 6
        def jvmVer = System.getProperty("java.version");// 1.7.0_25
        if (jvmVer =~ /^1\.[012345]\./) {
            java6 = false
        }
        else {
            java6 = true
        }

        // detect rows
        if (rows == null && System.getenv("LINES")) {
            rows = System.getenv("LINES") as int;
        }
        if (rows == null && resizeOut) {
            // may or may not be available, but try our best
            def m = (resizeOut =~ /LINES=(\d+)/ )
            if (m) {
                rows = m.group(1) as int;
            }
        }
        if (rows == null && sttyOut) {
            rows = sttyOut[0] as int
        }
//        if (rows == null && winModeOut) {
//            // may or may not be available, but try our best
//            def m = (winModeOut =~ /Lines: *(\d+)/)
//            if (m) {
//                rows = m.group(1) as int;
//            }
//        }

        // detect cols
        if (cols == null && System.getenv("COLUMNS")) {
            cols = System.getenv("COLUMNS") as int;
        }
        if (cols == null && resizeOut) {
            // may or may not be available, but try our best
            def m = (resizeOut =~ /COLUMNS=(\d+)/)
            if (m) {
                cols = m.group(1) as int;
            }
        }
        if (cols == null && sttyOut) {
            rows = sttyOut[1] as int
        }
//        if (cols == null && winModeOut) {
//            // may or may not be available, but try our best
//            def m = (winModeOut =~ /Columns: *(\d+)/)
//            if (m) {
//                cols = m.group(1) as int;
//            }
//        }


        // final initialization and adjustments
        if (rows == null) {
            rows = isWindows ? 25 : 20; // windows has 25 lines by default, *nix is usually 20
        }
        rows--; //leave room for paging prompt
        if (cols == null) {
            cols = 80;
        }
    }


    public void printText(String s){
        System.out.flush();

        def textList = [];
        // wrap rows to new column limit
        s.eachLine{ line ->
            while (line.length() > 0) {
                def lineChunk = line.substring(0, Math.min(cols, line.length()));
                if (lineChunk.length() == cols) {
                    def lastSpaceIndex = lineChunk.lastIndexOf(" ");
                    if (lastSpaceIndex > 0) {
                        lineChunk = lineChunk.substring(0, lastSpaceIndex);
                    }
                }

                textList << lineChunk;
                line = line.substring(lineChunk.length());
            }
        }

        def currentSegment = 1;
        def totalSegments = (Integer) Math.ceil(textList.size()/rows);

        for (int i = 0; i < textList.size(); i) {
            textList.subList(i, Math.min(i+rows, textList.size())).each{
                out.println(it);
            }
            out.println("");
            i += rows;

            if (i < textList.size()) {
                pause("("+currentSegment+"/"+totalSegments+")");
                currentSegment++;
            }
        }

        out.flush();
    }

    protected pause(String prefix) {
        if (!doPause) {
            return;
        }

        if (java6) {
            println prefix + " \"Enter\" for the next page, " +
                    "or \"F\" to print the full license: "
            String inputText = System.in.newReader().readLine();
            if (inputText && inputText.toLowerCase().startsWith("f")) {
                rows = 100000;
            }
        }
        else {
            println prefix+" \"Enter\" for the next page, or \"F\" to print the full license: "
            String inputText = new LineNumberReader(new InputStreamReader(System.in)).readLine();
            if (inputText && inputText.toLowerCase().startsWith("f")) {
                rows = 100000;
            }
        }
    }

    protected String exec(def cmd) {
        def stdOut = new StringBuilder();
        def stdErr = new StringBuilder();
        try {
            def p = cmd.execute();
            p.waitForProcessOutput(stdOut, stdErr);
        }
        catch (IOException e) { /* don't care*/ }
        return stdOut.toString();
    }
}
