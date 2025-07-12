# ReBasic Interpreter Core

ReBasic VM and core libraries.

It can run in a console mode,
but mostly usable within a browser shell.

Check out [rebasic.mix](https://github.com/invider/rebasic.mix)
for a full-featured retro web shell with examples and documentation.

ReBasic can run most of the examples from old BASIC books.
The difference is only in I/O operations, drawing
and all the PEEK and POKE magic you can find in the VIC20/C64 dialects.


## How to Install

Can be install locally by running ```./install``` script.


## How to Build


## How to Test

We use a single-bash-file testing framework ```retest``` for running our tests.

Just use a ```./test``` helper script to run ```retest``` in a verbose mode:

```
./test
```

## How to Debug

You can run rebasic with --debug flag to enable full stacktrace:

```
rebasic --debug
```
