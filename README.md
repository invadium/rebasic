# ReBasic Interpreter Core

Contains ReBasic parser, VM, core commands, and the test suite.

It is possible to run it standalone in a console mode,
but for most practical purposes, use the provided web shell
(or a desktop shell if you are reading this from the future).

Just jump to the full-featured retro web shell
at [ReBasic Itch.io Page (https://invadium.itch.io/rebasic)
and feel the vibes of 80s programming - where you don't care about
IDEs, repositories, build systems, package managers,
CI/CD pipelines and countless libraries and frameworks.

Check out the web shell sources with examples
and documentation at [rebasic.mix](https://github.com/invider/rebasic.mix).

ReBasic can run most of the examples from old BASIC books
except for I/O operations, drawing, and PEEK and POKE magic of VIC20/C64 dialects
(graphics commands are available only in the web shell, though).


## Prerequisites

You need a relatively fresh installation of Node.js to run and test the project.


## How to Install Interpreter

Can be installed locally by running ```./install``` script,
or directly with node ```sudo npm i -g```.

After that, you can use it from the command line like so:

```
rebasic ./my-basic-script.bas
```

Or to run in an interractive REPL mode:

```
rebasic
```


## How to Build

There is no particular "build" stage for the interpreter,
it is executed "as-is" from
[rebasic.js](https://github.com/invadium/rebasic/blob/master/rebasic.js)
and JavaScript files in [./js](https://github.com/invadium/rebasic/tree/master/js).


## How to Test

We use [ReTest](https://github.com/invadium/retest)
- a single-bash-drop-file testing anti-framework for testing.

Just call ```./test``` bash script to run the test suite in the verbose mode:

```
./test
```


## How to Debug

You can run rebasic with --debug flag to enable full stacktrace
in case of exceptions:

```
rebasic --debug
```




