/**
 * jQuery Calx 1.1.9
 * author :  Ikhsan Agustian <ikhsan017@gmail.com>
 * website:  http://www.xsanisty.com/calx
 * credit :  jison parser generator by Zach Carter <https://github.com/zaach/jison>,
 *              numeral.js for number formatting by Adam Drapper <https://github.com/adamwdraper/Numeral-js>
 *           stackoverflow community :D
 *           thanks for the formula_regex http://stackoverflow.com/users/1957251/khanh-to
 * lisence:  MIT
 */

(function($) {
    //ie support for Array.indexOf
    if (typeof Array.indexOf !== "function") {
        Array.prototype.indexOf = function(obj, start) {
            for (var i = (start || 0); i < this.length; i++) {
                if (this[i] == obj) {
                    return i;
                }
            }
            return -1;
        };
    }

    //ie support for String.trim method
    if (typeof String.prototype.trim !== 'function') {
        String.prototype.trim = function() {
            return this.replace(/^\s+|\s+$/g, '');
        };
    }

    //ie support for getPrototypeOf
    if (typeof Object.getPrototypeOf !== "function") {
        if (typeof "test".__proto__ === "object") {
            Object.getPrototypeOf = function(object) {
                return object.__proto__;
            };
        } else {
            Object.getPrototypeOf = function(object) {
                // May break if the constructor has been tampered with
                return object.constructor.prototype;
            };
        }
    }


    //utility function
    var utility = {

        /** number formatter, credit of Adam Drapper's Numeral.js */
        formatter: (function() {
            /************************************
         Constants
         ************************************/

            var numeral, VERSION = '1.4.9',
                // internal storage for language config files
                languages = {},
                currentLanguage = 'en',
                zeroFormat = null,
                // check for nodeJS
                hasModule = (typeof module !== 'undefined' && module.exports);


            /************************************
         Constructors
         ************************************/


            // Numeral prototype object


            function Numeral(number) {
                this._n = number;
            }

            /**
             * Implementation of toFixed() that treats floats more like decimals
             *
             * Fixes binary rounding issues (eg. (0.615).toFixed(2) === '0.61') that present
             * problems for accounting- and finance-related software.
             */

            function toFixed(value, precision, optionals) {
                var power = Math.pow(10, precision),
                    output;

                // Multiply up by precision, round accurately, then divide and use native toFixed():
                output = (Math.round(value * power) / power).toFixed(precision);

                if (optionals) {
                    var optionalsRegExp = new RegExp('0{1,' + optionals + '}$');
                    output = output.replace(optionalsRegExp, '');
                }

                return output;
            }

            /************************************
         Formatting
         ************************************/

            // determine what type of formatting we need to do


            function formatNumeral(n, format) {
                var output;

                // figure out what kind of format we are dealing with
                if (format.indexOf('$') > -1) { // currency!!!!!
                    output = formatCurrency(n, format);
                } else if (format.indexOf('%') > -1) { // percentage
                    output = formatPercentage(n, format);
                } else if (format.indexOf(':') > -1) { // time
                    output = formatTime(n, format);
                } else { // plain ol' numbers or bytes
                    output = formatNumber(n, format);
                }

                // return string
                return output;
            }

            // revert to number


            function unformatNumeral(n, string) {
                if (string.indexOf(':') > -1) {
                    n._n = unformatTime(string);
                } else {
                    if (string === zeroFormat) {
                        n._n = 0;
                    } else {
                        var stringOriginal = string;
                        if (languages[currentLanguage].delimiters.decimal !== '.') {
                            string = string.replace(/\./g, '').replace(languages[currentLanguage].delimiters.decimal, '.');
                        }

                        // see if abbreviations are there so that we can multiply to the correct number
                        var thousandRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.thousand + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                            millionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.million + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                            billionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.billion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$'),
                            trillionRegExp = new RegExp('[^a-zA-Z]' + languages[currentLanguage].abbreviations.trillion + '(?:\\)|(\\' + languages[currentLanguage].currency.symbol + ')?(?:\\))?)?$');

                        // see if bytes are there so that we can multiply to the correct number
                        var prefixes = ['KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                            bytesMultiplier = false;

                        for (var power = 0; power <= prefixes.length; power++) {
                            bytesMultiplier = (string.indexOf(prefixes[power]) > -1) ? Math.pow(1024, power + 1) : false;

                            if (bytesMultiplier) {
                                break;
                            }
                        }

                        // do some math to create our number
                        n._n = ((bytesMultiplier) ? bytesMultiplier : 1) * ((stringOriginal.match(thousandRegExp)) ? Math.pow(10, 3) : 1) * ((stringOriginal.match(millionRegExp)) ? Math.pow(10, 6) : 1) * ((stringOriginal.match(billionRegExp)) ? Math.pow(10, 9) : 1) * ((stringOriginal.match(trillionRegExp)) ? Math.pow(10, 12) : 1) * ((string.indexOf('%') > -1) ? 0.01 : 1) * Number(((string.indexOf('(') > -1) ? '-' : '') + string.replace(/[^0-9\.-]+/g, ''));

                        // round if we are talking about bytes
                        n._n = (bytesMultiplier) ? Math.ceil(n._n) : n._n;
                    }
                }
                return n._n;
            }

            function formatCurrency(n, format) {
                var prependSymbol = (format.indexOf('$') <= 1) ? true : false;

                // remove $ for the moment
                var space = '';

                // check for space before or after currency
                if (format.indexOf(' $') > -1) {
                    space = ' ';
                    format = format.replace(' $', '');
                } else if (format.indexOf('$ ') > -1) {
                    space = ' ';
                    format = format.replace('$ ', '');
                } else {
                    format = format.replace('$', '');
                }

                // format the number
                var output = formatNumeral(n, format);

                // position the symbol
                if (prependSymbol) {
                    if (output.indexOf('(') > -1 || output.indexOf('-') > -1) {
                        output = output.split('');
                        output.splice(1, 0, languages[currentLanguage].currency.symbol + space);
                        output = output.join('');
                    } else {
                        output = languages[currentLanguage].currency.symbol + space + output;
                    }
                } else {
                    if (output.indexOf(')') > -1) {
                        output = output.split('');
                        output.splice(-1, 0, space + languages[currentLanguage].currency.symbol);
                        output = output.join('');
                    } else {
                        output = output + space + languages[currentLanguage].currency.symbol;
                    }
                }

                return output;
            }

            function formatPercentage(n, format) {
                var space = '';
                // check for space before %
                if (format.indexOf(' %') > -1) {
                    space = ' ';
                    format = format.replace(' %', '');
                } else {
                    format = format.replace('%', '');
                }

                n._n = n._n * 100;
                var output = formatNumeral(n, format);
                if (output.indexOf(')') > -1) {
                    output = output.split('');
                    output.splice(-1, 0, space + '%');
                    output = output.join('');
                } else {
                    output = output + space + '%';
                }
                return output;
            }

            function formatTime(n, format) {
                var hours = Math.floor(n._n / 60 / 60),
                    minutes = Math.floor((n._n - (hours * 60 * 60)) / 60),
                    seconds = Math.round(n._n - (hours * 60 * 60) - (minutes * 60));
                return hours + ':' + ((minutes < 10) ? '0' + minutes : minutes) + ':' + ((seconds < 10) ? '0' + seconds : seconds);
            }

            function unformatTime(string) {
                var timeArray = string.split(':'),
                    seconds = 0;
                // turn hours and minutes into seconds and add them all up
                if (timeArray.length === 3) {
                    // hours
                    seconds = seconds + (Number(timeArray[0]) * 60 * 60);
                    // minutes
                    seconds = seconds + (Number(timeArray[1]) * 60);
                    // seconds
                    seconds = seconds + Number(timeArray[2]);
                } else if (timeArray.lenght === 2) {
                    // minutes
                    seconds = seconds + (Number(timeArray[0]) * 60);
                    // seconds
                    seconds = seconds + Number(timeArray[1]);
                }
                return Number(seconds);
            }

            function formatNumber(n, format) {
                var negP = false,
                    optDec = false,
                    abbr = '',
                    bytes = '',
                    ord = '',
                    abs = Math.abs(n._n);

                // check if number is zero and a custom zero format has been set
                if (n._n === 0 && zeroFormat !== null) {
                    return zeroFormat;
                } else {
                    // see if we should use parentheses for negative number
                    if (format.indexOf('(') > -1) {
                        negP = true;
                        format = format.slice(1, -1);
                    }

                    // see if abbreviation is wanted
                    if (format.indexOf('a') > -1) {
                        // check for space before abbreviation
                        if (format.indexOf(' a') > -1) {
                            abbr = ' ';
                            format = format.replace(' a', '');
                        } else {
                            format = format.replace('a', '');
                        }

                        if (abs >= Math.pow(10, 12)) {
                            // trillion
                            abbr = abbr + languages[currentLanguage].abbreviations.trillion;
                            n._n = n._n / Math.pow(10, 12);
                        } else if (abs < Math.pow(10, 12) && abs >= Math.pow(10, 9)) {
                            // billion
                            abbr = abbr + languages[currentLanguage].abbreviations.billion;
                            n._n = n._n / Math.pow(10, 9);
                        } else if (abs < Math.pow(10, 9) && abs >= Math.pow(10, 6)) {
                            // million
                            abbr = abbr + languages[currentLanguage].abbreviations.million;
                            n._n = n._n / Math.pow(10, 6);
                        } else if (abs < Math.pow(10, 6) && abs >= Math.pow(10, 3)) {
                            // thousand
                            abbr = abbr + languages[currentLanguage].abbreviations.thousand;
                            n._n = n._n / Math.pow(10, 3);
                        }
                    }

                    // see if we are formatting bytes
                    if (format.indexOf('b') > -1) {
                        // check for space before
                        if (format.indexOf(' b') > -1) {
                            bytes = ' ';
                            format = format.replace(' b', '');
                        } else {
                            format = format.replace('b', '');
                        }

                        var prefixes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'],
                            min, max;

                        for (var power = 0; power <= prefixes.length; power++) {
                            min = Math.pow(1024, power);
                            max = Math.pow(1024, power + 1);

                            if (n._n >= min && n._n < max) {
                                bytes = bytes + prefixes[power];
                                if (min > 0) {
                                    n._n = n._n / min;
                                }
                                break;
                            }
                        }
                    }

                    // see if ordinal is wanted
                    if (format.indexOf('o') > -1) {
                        // check for space before
                        if (format.indexOf(' o') > -1) {
                            ord = ' ';
                            format = format.replace(' o', '');
                        } else {
                            format = format.replace('o', '');
                        }

                        ord = ord + languages[currentLanguage].ordinal(n._n);
                    }

                    if (format.indexOf('[.]') > -1) {
                        optDec = true;
                        format = format.replace('[.]', '.');
                    }

                    var w = n._n.toString().split('.')[0],
                        precision = format.split('.')[1],
                        thousands = format.indexOf(','),
                        d = '',
                        neg = false;

                    if (precision) {
                        if (precision.indexOf('[') > -1) {
                            precision = precision.replace(']', '');
                            precision = precision.split('[');
                            d = toFixed(n._n, (precision[0].length + precision[1].length), precision[1].length);
                        } else {
                            d = toFixed(n._n, precision.length);
                        }

                        var strSplit = d.split('.');
                        w = strSplit[0];

                        if (typeof(strSplit[1]) != 'undefined') {
                            d = languages[currentLanguage].delimiters.decimal + strSplit[1];
                        } else {
                            d = '';
                        }

                        if (optDec && Number(d.slice(1)) === 0) {
                            d = '';
                        }
                    } else {
                        w = toFixed(n._n, null);
                    }

                    // format number
                    if (w.indexOf('-') > -1) {
                        w = w.slice(1);
                        neg = true;
                    }

                    if (thousands > -1) {
                        w = w.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, '$1' + languages[currentLanguage].delimiters.thousands);
                    }

                    if (format.indexOf('.') === 0) {
                        w = '';
                    }

                    return ((negP && neg) ? '(' : '') + ((!negP && neg) ? '-' : '') + w + d + ((ord) ? ord : '') + ((abbr) ? abbr : '') + ((bytes) ? bytes : '') + ((negP && neg) ? ')' : '');
                }
            }

            /************************************
         Top Level Functions
         ************************************/

            numeral = function(input) {
                if (numeral.isNumeral(input)) {
                    input = input.value();
                } else if (!Number(input)) {
                    input = 0;
                }

                return new Numeral(Number(input));
            };

            // version number
            numeral.version = VERSION;

            // compare numeral object
            numeral.isNumeral = function(obj) {
                return obj instanceof Numeral;
            };

            // This function will load languages and then set the global language.  If
            // no arguments are passed in, it will simply return the current global
            // language key.
            numeral.language = function(key, values) {
                if (!key) {
                    return currentLanguage;
                }

                if (key && !values) {
                    if (!languages[key]) {
                        throw new Error('Unknown language : ' + key);
                    }
                    currentLanguage = key;
                }

                if (values || !languages[key]) {
                    loadLanguage(key, values);
                }

                return numeral;
            };

            numeral.language('en', {
                delimiters: {
                    thousands: ',',
                    decimal: '.'
                },
                abbreviations: {
                    thousand: 'k',
                    million: 'm',
                    billion: 'b',
                    trillion: 't'
                },
                ordinal: function(number) {
                    var b = number % 10;
                    return (~~(number % 100 / 10) === 1) ? 'th' : (b === 1) ? 'st' : (b === 2) ? 'nd' : (b === 3) ? 'rd' : 'th';
                },
                currency: {
                    symbol: '$'
                }
            });

            numeral.zeroFormat = function(format) {
                if (typeof(format) === 'string') {
                    zeroFormat = format;
                } else {
                    zeroFormat = null;
                }
            };

            /************************************
         Helpers
         ************************************/

            function loadLanguage(key, values) {
                languages[key] = values;
            }


            /************************************
         Numeral Prototype
         ************************************/


            numeral.fn = Numeral.prototype = {

                clone: function() {
                    return numeral(this);
                },

                format: function(inputString) {
                    return formatNumeral(this, inputString ? inputString : numeral.defaultFormat);
                },

                unformat: function(inputString) {
                    return unformatNumeral(this, inputString ? inputString : numeral.defaultFormat);
                },

                value: function() {
                    return this._n;
                },

                valueOf: function() {
                    return this._n;
                },

                set: function(value) {
                    this._n = Number(value);
                    return this;
                },

                add: function(value) {
                    this._n = this._n + Number(value);
                    return this;
                },

                subtract: function(value) {
                    this._n = this._n - Number(value);
                    return this;
                },

                multiply: function(value) {
                    this._n = this._n * Number(value);
                    return this;
                },

                divide: function(value) {
                    this._n = this._n / Number(value);
                    return this;
                },

                difference: function(value) {
                    var difference = this._n - Number(value);

                    if (difference < 0) {
                        difference = -difference;
                    }

                    return difference;
                }

            };

            /************************************
         Exposing Numeral
         ************************************/

            // CommonJS module is defined
            if (hasModule) {
                module.exports = numeral;
            }

            /*global ender:false */
            if (typeof ender === 'undefined') {
                // here, `this` means `window` in the browser, or `global` on the server
                // add `numeral` as a global object via a string identifier,
                // for Closure Compiler 'advanced' mode
                this['numeral'] = numeral;
            }

            /*global define:false */
            if (typeof define === 'function' && define.amd) {
                define([], function() {
                    return numeral;
                });
            }

            return numeral;
        }).call(this),

        /**
         * parsing formula to be calculated, generated from jison file
         * need better jison file for better parsing since I know nothing about this
         * especially for formula parsing
         **/
        parser: (function() {
            var parser = {
                trace: function trace() {},
                yy: {},
                symbols_: {
                    "error": 2,
                    "expressions": 3,
                    "e": 4,
                    "EOF": 5,
                    "+": 6,
                    "-": 7,
                    "*": 8,
                    "/": 9,
                    ">": 10,
                    "<": 11,
                    "=": 12,
                    "^": 13,
                    "MOD": 14,
                    "OR": 15,
                    "AND": 16,
                    "(": 17,
                    ")": 18,
                    "ABS": 19,
                    "ROUND": 20,
                    "FLOOR": 21,
                    "CEIL": 22,
                    "SQRT": 23,
                    "IF": 24,
                    ",": 25,
                    "MAX": 26,
                    "MIN": 27,
                    "AVG": 28,
                    "SUM": 29,
                    "NUMBER": 30,
                    "E": 31,
                    "PI": 32,
                    "$accept": 0,
                    "$end": 1
                },
                terminals_: {
                    2: "error",
                    5: "EOF",
                    6: "+",
                    7: "-",
                    8: "*",
                    9: "/",
                    10: ">",
                    11: "<",
                    12: "=",
                    13: "^",
                    14: "MOD",
                    15: "OR",
                    16: "AND",
                    17: "(",
                    18: ")",
                    19: "ABS",
                    20: "ROUND",
                    21: "FLOOR",
                    22: "CEIL",
                    23: "SQRT",
                    24: "IF",
                    25: ",",
                    26: "MAX",
                    27: "MIN",
                    28: "AVG",
                    29: "SUM",
                    30: "NUMBER",
                    31: "E",
                    32: "PI"
                },
                productions_: [0, [3, 2],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 4],
                    [4, 4],
                    [4, 3],
                    [4, 4],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 3],
                    [4, 4],
                    [4, 4],
                    [4, 4],
                    [4, 4],
                    [4, 4],
                    [4, 8],
                    [4, 6],
                    [4, 6],
                    [4, 6],
                    [4, 6],
                    [4, 2],
                    [4, 1],
                    [4, 1],
                    [4, 1]
                ],
                performAction: function anonymous(yytext, yyleng, yylineno, yy, yystate, $$, _$) {
                    /* this == yyval */

                    var $0 = $$.length - 1;
                    switch (yystate) {
                        case 1:
                            return $$[$0 - 1];
                        case 2:
                            this.$ = $$[$0 - 2] + $$[$0];
                            break;
                        case 3:
                            this.$ = $$[$0 - 2] - $$[$0];
                            break;
                        case 4:
                            this.$ = $$[$0 - 2] * $$[$0];
                            break;
                        case 5:
                            this.$ = $$[$0 - 2] / $$[$0];
                            break;
                        case 6:
                            this.$ = $$[$0 - 2] > $$[$0];
                            break;
                        case 7:
                            this.$ = $$[$0 - 2] < $$[$0];
                            break;
                        case 8:
                            this.$ = $$[$0 - 3] >= $$[$0];
                            break;
                        case 9:
                            this.$ = $$[$0 - 3] <= $$[$0];
                            break;
                        case 10:
                            this.$ = $$[$0 - 2] == $$[$0];
                            break;
                        case 11:
                            this.$ = $$[$0 - 3] != $$[$0];
                            break;
                        case 12:
                            this.$ = Math.pow($$[$0 - 2], $$[$0]);
                            break;
                        case 13:
                            this.$ = $$[$0 - 2] % $$[$0];
                            break;
                        case 14:
                            this.$ = $$[$0 - 2] || $$[$0];
                            break;
                        case 15:
                            this.$ = $$[$0 - 2] && $$[$0];
                            break;
                        case 16:
                            this.$ = $$[$0 - 1];
                            break;
                        case 17:
                            this.$ = Math.abs($$[$0 - 1]);
                            break;
                        case 18:
                            this.$ = Math.round($$[$0 - 1]);
                            break;
                        case 19:
                            this.$ = Math.floor($$[$0 - 1]);
                            break;
                        case 20:
                            this.$ = Math.ceil($$[$0 - 1]);
                            break;
                        case 21:
                            this.$ = Math.sqrt($$[$0 - 1]);
                            break;
                        case 22:
                            this.$ = ($$[$0 - 5]) ? $$[$0 - 3] : $$[$0 - 1];
                            break;
                        case 23:
                            this.$ = formula.max($$[$0 - 3], $$[$0 - 1]);
                            break;
                        case 24:
                            this.$ = formula.min($$[$0 - 3], $$[$0 - 1]);
                            break;
                        case 25:
                            this.$ = formula.avg($$[$0 - 3], $$[$0 - 1]);
                            break;
                        case 26:
                            this.$ = formula.sum($$[$0 - 3], $$[$0 - 1]);
                            break;
                        case 27:
                            this.$ = -$$[$0];
                            break;
                        case 28:
                            this.$ = Number(yytext);
                            break;
                        case 29:
                            this.$ = Math.E;
                            break;
                        case 30:
                            this.$ = Math.PI;
                            break;
                    }
                },
                table: [{
                    3: 1,
                    4: 2,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    1: [3]
                }, {
                    5: [1, 18],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29]
                }, {
                    4: 30,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    17: [1, 31]
                }, {
                    17: [1, 32]
                }, {
                    17: [1, 33]
                }, {
                    17: [1, 34]
                }, {
                    17: [1, 35]
                }, {
                    17: [1, 36]
                }, {
                    17: [1, 37]
                }, {
                    17: [1, 38]
                }, {
                    17: [1, 39]
                }, {
                    17: [1, 40]
                }, {
                    4: 41,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    5: [2, 28],
                    6: [2, 28],
                    7: [2, 28],
                    8: [2, 28],
                    9: [2, 28],
                    10: [2, 28],
                    11: [2, 28],
                    12: [2, 28],
                    13: [2, 28],
                    14: [2, 28],
                    15: [2, 28],
                    16: [2, 28],
                    18: [2, 28],
                    25: [2, 28]
                }, {
                    5: [2, 29],
                    6: [2, 29],
                    7: [2, 29],
                    8: [2, 29],
                    9: [2, 29],
                    10: [2, 29],
                    11: [2, 29],
                    12: [2, 29],
                    13: [2, 29],
                    14: [2, 29],
                    15: [2, 29],
                    16: [2, 29],
                    18: [2, 29],
                    25: [2, 29]
                }, {
                    5: [2, 30],
                    6: [2, 30],
                    7: [2, 30],
                    8: [2, 30],
                    9: [2, 30],
                    10: [2, 30],
                    11: [2, 30],
                    12: [2, 30],
                    13: [2, 30],
                    14: [2, 30],
                    15: [2, 30],
                    16: [2, 30],
                    18: [2, 30],
                    25: [2, 30]
                }, {
                    1: [2, 1]
                }, {
                    4: 42,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 43,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 44,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 45,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 46,
                    7: [1, 14],
                    12: [1, 47],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 48,
                    7: [1, 14],
                    10: [1, 50],
                    12: [1, 49],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 51,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 52,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 53,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 54,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 55,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 56]
                }, {
                    4: 57,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 58,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 59,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 60,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 61,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 62,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 63,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 64,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 65,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 66,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    5: [2, 27],
                    6: [2, 27],
                    7: [2, 27],
                    8: [2, 27],
                    9: [2, 27],
                    10: [2, 27],
                    11: [2, 27],
                    12: [2, 27],
                    13: [2, 27],
                    14: [2, 27],
                    15: [2, 27],
                    16: [2, 27],
                    18: [2, 27],
                    25: [2, 27]
                }, {
                    5: [2, 2],
                    6: [2, 2],
                    7: [2, 2],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 2],
                    11: [2, 2],
                    12: [2, 2],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 2],
                    16: [2, 2],
                    18: [2, 2],
                    25: [2, 2]
                }, {
                    5: [2, 3],
                    6: [2, 3],
                    7: [2, 3],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 3],
                    11: [2, 3],
                    12: [2, 3],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 3],
                    16: [2, 3],
                    18: [2, 3],
                    25: [2, 3]
                }, {
                    5: [2, 4],
                    6: [2, 4],
                    7: [2, 4],
                    8: [2, 4],
                    9: [2, 4],
                    10: [2, 4],
                    11: [2, 4],
                    12: [2, 4],
                    13: [1, 26],
                    14: [2, 4],
                    15: [2, 4],
                    16: [2, 4],
                    18: [2, 4],
                    25: [2, 4]
                }, {
                    5: [2, 5],
                    6: [2, 5],
                    7: [2, 5],
                    8: [2, 5],
                    9: [2, 5],
                    10: [2, 5],
                    11: [2, 5],
                    12: [2, 5],
                    13: [1, 26],
                    14: [2, 5],
                    15: [2, 5],
                    16: [2, 5],
                    18: [2, 5],
                    25: [2, 5]
                }, {
                    5: [2, 6],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 6],
                    11: [2, 6],
                    12: [2, 6],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 6],
                    16: [2, 6],
                    18: [2, 6],
                    25: [2, 6]
                }, {
                    4: 67,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    5: [2, 7],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 7],
                    11: [2, 7],
                    12: [2, 7],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 7],
                    16: [2, 7],
                    18: [2, 7],
                    25: [2, 7]
                }, {
                    4: 68,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 69,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    5: [2, 10],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [2, 10],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 10],
                    16: [2, 10],
                    18: [2, 10],
                    25: [2, 10]
                }, {
                    5: [2, 12],
                    6: [2, 12],
                    7: [2, 12],
                    8: [2, 12],
                    9: [2, 12],
                    10: [2, 12],
                    11: [2, 12],
                    12: [2, 12],
                    13: [2, 12],
                    14: [2, 12],
                    15: [2, 12],
                    16: [2, 12],
                    18: [2, 12],
                    25: [2, 12]
                }, {
                    5: [2, 13],
                    6: [2, 13],
                    7: [2, 13],
                    8: [2, 13],
                    9: [2, 13],
                    10: [2, 13],
                    11: [2, 13],
                    12: [2, 13],
                    13: [1, 26],
                    14: [2, 13],
                    15: [2, 13],
                    16: [2, 13],
                    18: [2, 13],
                    25: [2, 13]
                }, {
                    5: [2, 14],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 14],
                    16: [2, 14],
                    18: [2, 14],
                    25: [2, 14]
                }, {
                    5: [2, 15],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 15],
                    16: [2, 15],
                    18: [2, 15],
                    25: [2, 15]
                }, {
                    5: [2, 16],
                    6: [2, 16],
                    7: [2, 16],
                    8: [2, 16],
                    9: [2, 16],
                    10: [2, 16],
                    11: [2, 16],
                    12: [2, 16],
                    13: [2, 16],
                    14: [2, 16],
                    15: [2, 16],
                    16: [2, 16],
                    18: [2, 16],
                    25: [2, 16]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 70]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 71]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 72]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 73]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 74]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 75]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 76]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 77]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 78]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 79]
                }, {
                    5: [2, 8],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 8],
                    11: [2, 8],
                    12: [2, 8],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 8],
                    16: [2, 8],
                    18: [2, 8],
                    25: [2, 8]
                }, {
                    5: [2, 9],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 9],
                    11: [2, 9],
                    12: [2, 9],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 9],
                    16: [2, 9],
                    18: [2, 9],
                    25: [2, 9]
                }, {
                    5: [2, 11],
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [2, 11],
                    11: [2, 11],
                    12: [2, 11],
                    13: [1, 26],
                    14: [1, 27],
                    15: [2, 11],
                    16: [2, 11],
                    18: [2, 11],
                    25: [2, 11]
                }, {
                    5: [2, 17],
                    6: [2, 17],
                    7: [2, 17],
                    8: [2, 17],
                    9: [2, 17],
                    10: [2, 17],
                    11: [2, 17],
                    12: [2, 17],
                    13: [2, 17],
                    14: [2, 17],
                    15: [2, 17],
                    16: [2, 17],
                    18: [2, 17],
                    25: [2, 17]
                }, {
                    5: [2, 18],
                    6: [2, 18],
                    7: [2, 18],
                    8: [2, 18],
                    9: [2, 18],
                    10: [2, 18],
                    11: [2, 18],
                    12: [2, 18],
                    13: [2, 18],
                    14: [2, 18],
                    15: [2, 18],
                    16: [2, 18],
                    18: [2, 18],
                    25: [2, 18]
                }, {
                    5: [2, 19],
                    6: [2, 19],
                    7: [2, 19],
                    8: [2, 19],
                    9: [2, 19],
                    10: [2, 19],
                    11: [2, 19],
                    12: [2, 19],
                    13: [2, 19],
                    14: [2, 19],
                    15: [2, 19],
                    16: [2, 19],
                    18: [2, 19],
                    25: [2, 19]
                }, {
                    5: [2, 20],
                    6: [2, 20],
                    7: [2, 20],
                    8: [2, 20],
                    9: [2, 20],
                    10: [2, 20],
                    11: [2, 20],
                    12: [2, 20],
                    13: [2, 20],
                    14: [2, 20],
                    15: [2, 20],
                    16: [2, 20],
                    18: [2, 20],
                    25: [2, 20]
                }, {
                    5: [2, 21],
                    6: [2, 21],
                    7: [2, 21],
                    8: [2, 21],
                    9: [2, 21],
                    10: [2, 21],
                    11: [2, 21],
                    12: [2, 21],
                    13: [2, 21],
                    14: [2, 21],
                    15: [2, 21],
                    16: [2, 21],
                    18: [2, 21],
                    25: [2, 21]
                }, {
                    4: 80,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 81,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 82,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 83,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    4: 84,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    25: [1, 85]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 86]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 87]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 88]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 89]
                }, {
                    4: 90,
                    7: [1, 14],
                    17: [1, 3],
                    19: [1, 4],
                    20: [1, 5],
                    21: [1, 6],
                    22: [1, 7],
                    23: [1, 8],
                    24: [1, 9],
                    26: [1, 10],
                    27: [1, 11],
                    28: [1, 12],
                    29: [1, 13],
                    30: [1, 15],
                    31: [1, 16],
                    32: [1, 17]
                }, {
                    5: [2, 23],
                    6: [2, 23],
                    7: [2, 23],
                    8: [2, 23],
                    9: [2, 23],
                    10: [2, 23],
                    11: [2, 23],
                    12: [2, 23],
                    13: [2, 23],
                    14: [2, 23],
                    15: [2, 23],
                    16: [2, 23],
                    18: [2, 23],
                    25: [2, 23]
                }, {
                    5: [2, 24],
                    6: [2, 24],
                    7: [2, 24],
                    8: [2, 24],
                    9: [2, 24],
                    10: [2, 24],
                    11: [2, 24],
                    12: [2, 24],
                    13: [2, 24],
                    14: [2, 24],
                    15: [2, 24],
                    16: [2, 24],
                    18: [2, 24],
                    25: [2, 24]
                }, {
                    5: [2, 25],
                    6: [2, 25],
                    7: [2, 25],
                    8: [2, 25],
                    9: [2, 25],
                    10: [2, 25],
                    11: [2, 25],
                    12: [2, 25],
                    13: [2, 25],
                    14: [2, 25],
                    15: [2, 25],
                    16: [2, 25],
                    18: [2, 25],
                    25: [2, 25]
                }, {
                    5: [2, 26],
                    6: [2, 26],
                    7: [2, 26],
                    8: [2, 26],
                    9: [2, 26],
                    10: [2, 26],
                    11: [2, 26],
                    12: [2, 26],
                    13: [2, 26],
                    14: [2, 26],
                    15: [2, 26],
                    16: [2, 26],
                    18: [2, 26],
                    25: [2, 26]
                }, {
                    6: [1, 19],
                    7: [1, 20],
                    8: [1, 21],
                    9: [1, 22],
                    10: [1, 23],
                    11: [1, 24],
                    12: [1, 25],
                    13: [1, 26],
                    14: [1, 27],
                    15: [1, 28],
                    16: [1, 29],
                    18: [1, 91]
                }, {
                    5: [2, 22],
                    6: [2, 22],
                    7: [2, 22],
                    8: [2, 22],
                    9: [2, 22],
                    10: [2, 22],
                    11: [2, 22],
                    12: [2, 22],
                    13: [2, 22],
                    14: [2, 22],
                    15: [2, 22],
                    16: [2, 22],
                    18: [2, 22],
                    25: [2, 22]
                }],
                defaultActions: {
                    18: [2, 1]
                },
                parseError: function parseError(str, hash) {
                    if (hash.recoverable) {
                        this.trace(str);
                    } else {
                        throw new Error(str);
                    }
                },
                parse: function parse(input) {
                    var self = this,
                        stack = [0],
                        vstack = [null],
                        lstack = [],
                        table = this.table,
                        yytext = '',
                        yylineno = 0,
                        yyleng = 0,
                        recovering = 0,
                        TERROR = 2,
                        EOF = 1;
                    var args = lstack.slice.call(arguments, 1);
                    this.lexer.setInput(input);
                    this.lexer.yy = this.yy;
                    this.yy.lexer = this.lexer;
                    this.yy.parser = this;
                    if (typeof this.lexer.yylloc == 'undefined') {
                        this.lexer.yylloc = {};
                    }
                    var yyloc = this.lexer.yylloc;
                    lstack.push(yyloc);
                    var ranges = this.lexer.options && this.lexer.options.ranges;
                    if (typeof this.yy.parseError === 'function') {
                        this.parseError = this.yy.parseError;
                    } else {
                        this.parseError = Object.getPrototypeOf(this).parseError;
                    }

                    function popStack(n) {
                        stack.length = stack.length - 2 * n;
                        vstack.length = vstack.length - n;
                        lstack.length = lstack.length - n;
                    }

                    function lex() {
                        var token;
                        token = self.lexer.lex() || EOF;
                        if (typeof token !== 'number') {
                            token = self.symbols_[token] || token;
                        }
                        return token;
                    }
                    var symbol, preErrorSymbol, state, action, a, r, yyval = {}, p, len, newState, expected;
                    while (true) {
                        state = stack[stack.length - 1];
                        if (this.defaultActions[state]) {
                            action = this.defaultActions[state];
                        } else {
                            if (symbol === null || typeof symbol == 'undefined') {
                                symbol = lex();
                            }
                            action = table[state] && table[state][symbol];
                        }
                        if (typeof action === 'undefined' || !action.length || !action[0]) {
                            var errStr = '';
                            expected = [];
                            for (p in table[state]) {
                                if (this.terminals_[p] && p > TERROR) {
                                    expected.push('\'' + this.terminals_[p] + '\'');
                                }
                            }
                            if (this.lexer.showPosition) {
                                errStr = 'Parse error on line ' + (yylineno + 1) + ':\n' + this.lexer.showPosition() + '\nExpecting ' + expected.join(', ') + ', got \'' + (this.terminals_[symbol] || symbol) + '\'';
                            } else {
                                errStr = 'Parse error on line ' + (yylineno + 1) + ': Unexpected ' + (symbol == EOF ? 'end of input' : '\'' + (this.terminals_[symbol] || symbol) + '\'');
                            }
                            this.parseError(errStr, {
                                text: this.lexer.match,
                                token: this.terminals_[symbol] || symbol,
                                line: this.lexer.yylineno,
                                loc: yyloc,
                                expected: expected
                            });
                        }
                        if (action[0] instanceof Array && action.length > 1) {
                            throw new Error('Parse Error: multiple actions possible at state: ' + state + ', token: ' + symbol);
                        }
                        switch (action[0]) {
                            case 1:
                                stack.push(symbol);
                                vstack.push(this.lexer.yytext);
                                lstack.push(this.lexer.yylloc);
                                stack.push(action[1]);
                                symbol = null;
                                if (!preErrorSymbol) {
                                    yyleng = this.lexer.yyleng;
                                    yytext = this.lexer.yytext;
                                    yylineno = this.lexer.yylineno;
                                    yyloc = this.lexer.yylloc;
                                    if (recovering > 0) {
                                        recovering--;
                                    }
                                } else {
                                    symbol = preErrorSymbol;
                                    preErrorSymbol = null;
                                }
                                break;
                            case 2:
                                len = this.productions_[action[1]][1];
                                yyval.$ = vstack[vstack.length - len];
                                yyval._$ = {
                                    first_line: lstack[lstack.length - (len || 1)].first_line,
                                    last_line: lstack[lstack.length - 1].last_line,
                                    first_column: lstack[lstack.length - (len || 1)].first_column,
                                    last_column: lstack[lstack.length - 1].last_column
                                };
                                if (ranges) {
                                    yyval._$.range = [
                                        lstack[lstack.length - (len || 1)].range[0],
                                        lstack[lstack.length - 1].range[1]
                                    ];
                                }
                                r = this.performAction.apply(yyval, [
                                    yytext,
                                    yyleng,
                                    yylineno,
                                    this.yy,
                                    action[1],
                                    vstack,
                                    lstack
                                ].concat(args));
                                if (typeof r !== 'undefined') {
                                    return r;
                                }
                                if (len) {
                                    stack = stack.slice(0, -1 * len * 2);
                                    vstack = vstack.slice(0, -1 * len);
                                    lstack = lstack.slice(0, -1 * len);
                                }
                                stack.push(this.productions_[action[1]][0]);
                                vstack.push(yyval.$);
                                lstack.push(yyval._$);
                                newState = table[stack[stack.length - 2]][stack[stack.length - 1]];
                                stack.push(newState);
                                break;
                            case 3:
                                return true;
                        }
                    }
                    return true;
                }
            };
            /* generated by jison-lex 0.2.1 */
            var lexer = (function() {
                var lexer = {

                    EOF: 1,

                    parseError: function parseError(str, hash) {
                        "use strict";
                        if (this.yy.parser) {
                            this.yy.parser.parseError(str, hash);
                        } else {
                            throw new Error(str);
                        }
                    },

                    // resets the lexer, sets new input
                    setInput: function(input) {
                        "use strict";
                        this._input = input;
                        this._more = this._backtrack = this.done = false;
                        this.yylineno = this.yyleng = 0;
                        this.yytext = this.matched = this.match = "";
                        this.conditionStack = ["INITIAL"];
                        this.yylloc = {
                            first_line: 1,
                            first_column: 0,
                            last_line: 1,
                            last_column: 0
                        };
                        if (this.options.ranges) {
                            this.yylloc.range = [0, 0];
                        }
                        this.offset = 0;
                        return this;
                    },

                    // consumes and returns one char from the input
                    input: function() {
                        "use strict";
                        var ch = this._input[0];
                        this.yytext += ch;
                        this.yyleng++;
                        this.offset++;
                        this.match += ch;
                        this.matched += ch;
                        var lines = ch.match(/(?:\r\n?|\n).*/g);
                        if (lines) {
                            this.yylineno++;
                            this.yylloc.last_line++;
                        } else {
                            this.yylloc.last_column++;
                        } if (this.options.ranges) {
                            this.yylloc.range[1]++;
                        }
                        this._input = this._input.slice(1);
                        return ch;
                    },

                    // unshifts one char (or a string) into the input
                    unput: function(ch) {
                        "use strict";
                        var len = ch.length;
                        var lines = ch.split(/(?:\r\n?|\n)/g);
                        this._input = ch + this._input;
                        this.yytext = this.yytext.substr(0, this.yytext.length - len - 1);
                        this.offset -= len;
                        var oldLines = this.match.split(/(?:\r\n?|\n)/g);
                        this.match = this.match.substr(0, this.match.length - 1);
                        this.matched = this.matched.substr(0, this.matched.length - 1);
                        if (lines.length - 1) {
                            this.yylineno -= lines.length - 1;
                        }
                        var r = this.yylloc.range;
                        this.yylloc = {
                            first_line: this.yylloc.first_line,
                            last_line: this.yylineno + 1,
                            first_column: this.yylloc.first_column,
                            last_column: lines ? (lines.length === oldLines.length ? this.yylloc.first_column : 0) + oldLines[oldLines.length - lines.length].length - lines[0].length : this.yylloc.first_column - len
                        };
                        if (this.options.ranges) {
                            this.yylloc.range = [r[0], r[0] + this.yyleng - len];
                        }
                        this.yyleng = this.yytext.length;
                        return this;
                    },

                    // When called from action, caches matched text and appends it on next action
                    more: function() {
                        "use strict";
                        this._more = true;
                        return this;
                    },

                    // When called from action, signals the lexer that this rule fails to match the input, so the next matching rule (regex) should be tested instead.
                    reject: function() {
                        "use strict";
                        if (this.options.backtrack_lexer) {
                            this._backtrack = true;
                        } else {
                            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". You can only invoke reject() in the lexer when the lexer is of the backtracking persuasion (options.backtrack_lexer = true).\n" + this.showPosition(), {
                                text: "",
                                token: null,
                                line: this.yylineno
                            });
                        }
                        return this;
                    },

                    // retain first n characters of the match
                    less: function(n) {
                        "use strict";
                        this.unput(this.match.slice(n));
                    },

                    // displays already matched input, i.e. for error messages
                    pastInput: function() {
                        "use strict";
                        var past = this.matched.substr(0, this.matched.length - this.match.length);
                        return (past.length > 20 ? "..." : "") + past.substr(-20).replace(/\n/g, "");
                    },

                    // displays upcoming input, i.e. for error messages
                    upcomingInput: function() {
                        "use strict";
                        var next = this.match;
                        if (next.length < 20) {
                            next += this._input.substr(0, 20 - next.length);
                        }
                        return (next.substr(0, 20) + (next.length > 20 ? "..." : "")).replace(/\n/g, "");
                    },

                    // displays the character position where the lexing error occurred, i.e. for error messages
                    showPosition: function() {
                        "use strict";
                        var pre = this.pastInput();
                        var c = new Array(pre.length + 1).join("-");
                        return pre + this.upcomingInput() + "\n" + c + "^";
                    },

                    // test the lexed token: return FALSE when not a match, otherwise return token
                    test_match: function(match, indexed_rule) {
                        "use strict";
                        var token, lines, backup;
                        if (this.options.backtrack_lexer) {
                            backup = {
                                yylineno: this.yylineno,
                                yylloc: {
                                    first_line: this.yylloc.first_line,
                                    last_line: this.last_line,
                                    first_column: this.yylloc.first_column,
                                    last_column: this.yylloc.last_column
                                },
                                yytext: this.yytext,
                                match: this.match,
                                matches: this.matches,
                                matched: this.matched,
                                yyleng: this.yyleng,
                                offset: this.offset,
                                _more: this._more,
                                _input: this._input,
                                yy: this.yy,
                                conditionStack: this.conditionStack.slice(0),
                                done: this.done
                            };
                            if (this.options.ranges) {
                                backup.yylloc.range = this.yylloc.range.slice(0);
                            }
                        }
                        lines = match[0].match(/(?:\r\n?|\n).*/g);
                        if (lines) {
                            this.yylineno += lines.length;
                        }
                        this.yylloc = {
                            first_line: this.yylloc.last_line,
                            last_line: this.yylineno + 1,
                            first_column: this.yylloc.last_column,
                            last_column: lines ? lines[lines.length - 1].length - lines[lines.length - 1].match(/\r?\n?/)[0].length : this.yylloc.last_column + match[0].length
                        };
                        this.yytext += match[0];
                        this.match += match[0];
                        this.matches = match;
                        this.yyleng = this.yytext.length;
                        if (this.options.ranges) {
                            this.yylloc.range = [this.offset, this.offset += this.yyleng];
                        }
                        this._more = false;
                        this._backtrack = false;
                        this._input = this._input.slice(match[0].length);
                        this.matched += match[0];
                        token = this.performAction.call(this, this.yy, this, indexed_rule, this.conditionStack[this.conditionStack.length - 1]);
                        if (this.done && this._input) {
                            this.done = false;
                        }
                        if (token) {
                            return token;
                        } else if (this._backtrack) {
                            for (var k in backup) {
                                this[k] = backup[k];
                            }
                            return false;
                        }
                        return false;
                    },

                    // return next match in input
                    next: function() {
                        "use strict";
                        if (this.done) {
                            return this.EOF;
                        }
                        if (!this._input) {
                            this.done = true;
                        }
                        var token, match, tempMatch, index;
                        if (!this._more) {
                            this.yytext = "";
                            this.match = "";
                        }
                        var rules = this._currentRules();
                        for (var i = 0; i < rules.length; i++) {
                            tempMatch = this._input.match(this.rules[rules[i]]);
                            if (tempMatch && (!match || tempMatch[0].length > match[0].length)) {
                                match = tempMatch;
                                index = i;
                                if (this.options.backtrack_lexer) {
                                    token = this.test_match(tempMatch, rules[i]);
                                    if (token !== false) {
                                        return token;
                                    } else if (this._backtrack) {
                                        match = false;
                                        continue;
                                    } else {
                                        return false;
                                    }
                                } else if (!this.options.flex) {
                                    break;
                                }
                            }
                        }
                        if (match) {
                            token = this.test_match(match, rules[index]);
                            if (token !== false) {
                                return token;
                            }
                            return false;
                        }
                        if (this._input === "") {
                            return this.EOF;
                        } else {
                            return this.parseError("Lexical error on line " + (this.yylineno + 1) + ". Unrecognized text.\n" + this.showPosition(), {
                                text: "",
                                token: null,
                                line: this.yylineno
                            });
                        }
                    },

                    // return next match that has a token
                    lex: function lex() {
                        "use strict";
                        var r = this.next();
                        if (r) {
                            return r;
                        } else {
                            return this.lex();
                        }
                    },

                    // activates a new lexer condition state (pushes the new lexer condition state onto the condition stack)
                    begin: function begin(condition) {
                        "use strict";
                        this.conditionStack.push(condition);
                    },

                    // pop the previously active lexer condition state off the condition stack
                    popState: function popState() {
                        "use strict";
                        var n = this.conditionStack.length - 1;
                        if (n > 0) {
                            return this.conditionStack.pop();
                        } else {
                            return this.conditionStack[0];
                        }
                    },

                    // produce the lexer rule set which is active for the currently active lexer condition state
                    _currentRules: function _currentRules() {
                        "use strict";
                        if (this.conditionStack.length && this.conditionStack[this.conditionStack.length - 1]) {
                            return this.conditions[this.conditionStack[this.conditionStack.length - 1]].rules;
                        } else {
                            return this.conditions["INITIAL"].rules;
                        }
                    },

                    // return the currently active lexer condition state; when an index argument is provided it produces the N-th previous condition state, if available
                    topState: function topState(n) {
                        "use strict";
                        n = this.conditionStack.length - 1 - Math.abs(n || 0);
                        if (n >= 0) {
                            return this.conditionStack[n];
                        } else {
                            return "INITIAL";
                        }
                    },

                    // alias for begin(condition)
                    pushState: function pushState(condition) {
                        "use strict";
                        this.begin(condition);
                    },

                    // return the number of states currently on the stack
                    stateStackSize: function stateStackSize() {
                        "use strict";
                        return this.conditionStack.length;
                    },
                    options: {},
                    performAction: function anonymous(yy, yy_, $avoiding_name_collisions, YY_START) {

                        var YYSTATE = YY_START;
                        switch ($avoiding_name_collisions) {
                            case 0:
                                /* skip whitespace */
                                    break;
                            case 1:
                                return 30;
                            case 2:
                                return 8;
                            case 3:
                                return 9;
                            case 4:
                                return 14;
                            case 5:
                                return 7;
                            case 6:
                                return 6;
                            case 7:
                                return 13;
                            case 8:
                                return 23;
                            case 9:
                                return 16;
                            case 10:
                                return 15;
                            case 11:
                                return 17;
                            case 12:
                                return 18;
                            case 13:
                                return 25;
                            case 14:
                                return 10;
                            case 15:
                                return 11;
                            case 16:
                                return 12;
                            case 17:
                                return 32;
                            case 18:
                                return 31;
                            case 19:
                                return 24;
                            case 20:
                                return 19;
                            case 21:
                                return 20;
                            case 22:
                                return 21;
                            case 23:
                                return 22;
                            case 24:
                                return 26;
                            case 25:
                                return 27;
                            case 26:
                                return 28;
                            case 27:
                                return 29;
                            case 28:
                                return 5;
                            case 29:
                                return 'INVALID';
                        }
                    },
                    rules: [/^(?:\s+)/, /^(?:[0-9]+(\.[0-9]+)?\b)/, /^(?:\*)/, /^(?:\/)/, /^(?:MOD\b)/, /^(?:-)/, /^(?:\+)/, /^(?:\^)/, /^(?:SQRT\b)/, /^(?:AND\b)/, /^(?:OR\b)/, /^(?:\()/, /^(?:\))/, /^(?:,)/, /^(?:>)/, /^(?:<)/, /^(?:=)/, /^(?:PI\b)/, /^(?:E\b)/, /^(?:IF\b)/, /^(?:ABS\b)/, /^(?:ROUND\b)/, /^(?:FLOOR\b)/, /^(?:CEIL\b)/, /^(?:MAX\b)/, /^(?:MIN\b)/, /^(?:AVG\b)/, /^(?:SUM\b)/, /^(?:$)/, /^(?:.)/],
                    conditions: {
                        "INITIAL": {
                            "rules": [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 29],
                            "inclusive": true
                        }
                    }
                };
                return lexer;
            })();
            parser.lexer = lexer;

            function Parser() {
                this.yy = {};
            }
            Parser.prototype = parser;
            parser.Parser = Parser;
            return new Parser();
        })(),

        /** convert string char to number, e.g A => 1, Z => 26, AA => 27 */
        toNum: function(chr) {
            chr = chr.split('');
            var base = ["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "K", "L", "M", "N", "O", "P", "Q", "R", "S", "T", "U", "V", "W", "X", "Y", "Z"],
                i, j, result = 0;

            for (i = 0, j = chr.length - 1; i < chr.length; i += 1, j -= 1) {
                result += Math.pow(base.length, j) * (base.indexOf(chr[i]) + 1);
            }
            return result;
        },

        /** convert number to string char, e.g 1 => A, 26 => Z, 27 => AA */
        toChr: function(num) {
            var s = "";
            num = num - 1;
            while (num >= 0) {
                s = String.fromCharCode(num % 26 + 97) + s;
                num = Math.floor(num / 26) - 1;
            }
            return s.toUpperCase();
        },

        /** translate cell into row-col pair for easy range iteration, e.g B20 => {row:20, col:2} , or 20.2 when type='string'*/
        translateCell: function($cell, $type) {
            var num = $cell.match(/\d+$/);
            var alpha = $cell.replace(num, '');

            var $return = {
                row: parseInt(num[0], 10),
                col: utility.toNum(alpha)
            };

            if ($type == 'string') {
                return $return.col + '.' + $return.row;
            } else {
                return $return;
            }
        },

        /** iterating cell range, 1.101 type index, throw $return object to callback*/
        iterateCell: function(a, b, callback) {
            var $return = {
                index: [],
                //list of cell index, A1,A2,A3 and so on
                value: [] //list of cell values
            };
            var $start = ('' + a).split('.');
            var $stop = ('' + b).split('.');

            $start[1] = $start[1].substring(0, $start[1].length - 1);
            $stop[1] = $stop[1].substring(0, $stop[1].length - 1);

            for (var ax = 0; ax < $start.length; ax++) {
                $start[ax] = parseInt($start[ax], 10);
                $stop[ax] = parseInt($stop[ax], 10);
            }

            var $c_start = ($start[0] < $stop[0]) ? $start[0] : $stop[0];
            var $c_stop = ($start[0] > $stop[0]) ? $start[0] : $stop[0];
            var $r_start = ($start[1] < $stop[1]) ? $start[1] : $stop[1];
            var $r_stop = ($start[1] > $stop[1]) ? $start[1] : $stop[1];

            for (col = $c_start; col <= $c_stop; col++) {
                for (row = $r_start; row <= $r_stop; row++) {
                    var $cellIndex = utility.toChr(col) + row;
                    var $cellValue = calx.matrix[formula.key].value[$cellIndex];
                    $cellValue = ($cellValue) ? parseFloat($cellValue) : 0;

                    $return.index.push($cellIndex);
                    $return.value.push($cellValue);
                }
            }

            return callback.apply(callback, [$return]);
        }
    };


    //default plugin configuration
    var defaults = {
        //autocalculate value on form change when used on form
        autocalculate: true,

        //autocalculate trigger: not yet implemented
        trigger: 'blur',

        //default format used when no data-format found
        format: '0[.]00',

        //mark input with data-formula attribute as readonly
        readonly: true,

        //default language id
        language: 'en',

        //zero formatting
        zeroformat: null,

        //display value round
        round : 3,

        //update callback
        onupdate : false
    };

    var form_element = ['input', 'button', 'select', 'textarea'];

    //formula function
    var formula = { /** list of registered member that use range as parameter, capitalized */
        member: ['MAX', 'MIN', 'SUM', 'AVG'],
        error: [],
        key: '',

        /** member function declaration, function name must be in lower case
         *  instead of A3 or C10 as parameter, function will recieve 1.3+'1' => 1.31 or 3.10+'1" => 3.101 as parameter (col.row)
         **/
        max: function(a, b) {
            return utility.iterateCell(a, b, function($cell) {
                return Math.max.apply(Math, $cell.value);
            });
        },
        min: function(a, b) {
            return utility.iterateCell(a, b, function($cell) {
                return Math.min.apply(Math, $cell.value);
            });
        },
        sum: function(a, b) {
            return utility.iterateCell(a, b, function($cell) {
                var $result = 0;
                for (var i = 0; i < $cell.value.length; i++) {
                    $result += $cell.value[i];
                }
                return $result;
            });
        },
        avg: function(a, b) {
            return utility.iterateCell(a, b, function($cell) {
                var $result = 0;
                for (var i = 0; i < $cell.value.length; i++) {
                    $result += $cell.value[i];
                }

                return ($result / $cell.value.length);
            });
        }
    };

    /** planned for future added formula */
    formula.financial = {

    };

    formula.math = {

    };

    formula.statistic = {

    };

    formula.logic = {

    };

    formula.general = {

    };

    /** matrix contain cache of all form element value and format */
    var matrix = function($key) {
        this.key = $key;
        this.lang = 'en';
        this.zeroformat = null;
        this.data = {}; //detail data attribute of each cell
        this.value = {}; //native numeric value of each cell
    };

    /** update matrix value when form data changed */
    matrix.prototype.update = function($apply, $callback) {
        var $dataKey;

        if (typeof($apply) == 'undefined') {
            $apply = false;
        }

        /** prepare update status for each cell */
        for ($dataKey in this.data) {
            if (this.data[$dataKey].dependency.length === 0) {
                this.data[$dataKey].updated = true;
            } else {
                this.data[$dataKey].updated = false;
            }
        }

        /** for each element with formula in it, process the formula */
        for ($dataKey in this.data) {
            if (typeof(this.data[$dataKey].formula) != 'undefined') {
                this.calculate($dataKey, $apply);
            }
        }


        if(typeof($callback) == 'function' && $apply){
            $callback.apply(undefined, [this.value]);
        }
    };

    /** calculate single matrix data member, including it's dependencies */
    matrix.prototype.calculate = function($key, $apply) {
        /** if cell not updated, calculate it! */
        if (!this.data[$key].updated) {
            if (this.data[$key].dependency.length !== 0) {
                var $dkey;

                for ($dkey = 0; $dkey < this.data[$key].dependency.length; $dkey++) {
                    var $dval = this.data[$key].dependency[$dkey];

                    if (typeof(this.data[$dval]) == 'object') {
                        if (!this.data[$dval].updated) {
                            this.calculate($dval);
                        }
                    }
                }
            }

            //replace the formula with the value
            if (typeof(this.data[$key].formula) != 'undefined') {
                var $replaceVal = {};
                var $stringVal = '';
                var $k;
                for ($k in this.data[$key].dependency) {
                    var $v = this.data[$key].dependency[$k];
                    $replaceVal['$' + $v] = this.value[$v];
                    $stringVal += this.value[$v];
                }

                if (this.data[$key].formula.trim() !== '') {
                    var $equation = '';
                    var $regex = '(' + formula.member.join('|') + ')\\(([^(^)]*)\\)';
                    var $formula_regex = new RegExp($regex, 'g');

                    $equation = this.data[$key].formula.replace($formula_regex, function($range) {
                        $range = $range.replace(/\$\w+/g, function($key) {
                            $key = $key.replace('$', '');
                            $key = utility.translateCell($key, 'string');
                            return $key + '1';
                        });
                        return ($range);
                    });

                    $equation = $equation.replace(/\$\w+/g, function($key) {
                        return $replaceVal[$key] || '0';
                    });

                    //if all value matched, execute the formula
                    if ($equation.indexOf('$') < 0) {
                        formula.key = this.key;
                        var $result = utility.parser.parse($equation);
                        this.data[$key].value = isNaN($result) ? 0 : $result;
                        this.value[$key] = isNaN($result) ? '' : this.data[$key].value;
                    }
                }
            }
        }
        this.data[$key].updated = true;
        if ($apply) {
            this.apply($key);
        }

    };

    matrix.prototype.apply = function($key) {
        utility.formatter.language(this.lang);
        if (typeof($key) == 'undefined') {
            $.each(this.value, function($index, $val) {
                var $key = $index.replace(/\$/g, '');
                var $el = $('#' + $key);

                if ($el.length !== 0) {
                    if (form_element.indexOf($el.prop('tagName').toLowerCase()) > -1) {
                        $el.val(utility.formatter(this.value[$key]).format(this.data[$key].format));
                    } else {
                        $el.html(utility.formatter(this.value[$key]).format(this.data[$key].format));
                    }
                }

            });
        } else {
            var $el = $('#' + $key);

            if ($el.length !== 0) {
                if (form_element.indexOf($el.prop('tagName').toLowerCase()) > -1) {
                    $el.val(utility.formatter(this.value[$key]).format(this.data[$key].format));
                } else {
                    $el.html(utility.formatter(this.value[$key]).format(this.data[$key].format));
                }
            }
        }
    };

    matrix.prototype.clean = function() {
        var $this = this;
        $.each($this.value, function(id, val) {
            if ($('#' + id).length === 0) {
                delete $this.data[id];
                delete $this.value[id];
            }
        });
    };


    /** calx function member */
    var calx = {
        /** list of affected elements for each form */
        cell: {},

        /** matrix collection for each form */
        matrix: {},

        /** default settings */
        settings: {},

        /** initialize the plugin */
        init: function($options) {
            return this.each(function() {
                var $form = $(this);
                if ($form.attr('data-calx-enable') != '1') {
                    var $key = new Date().valueOf();
                    calx.matrix[$key] = new matrix($key);
                    calx.cell[$key] = [];
                    calx.settings[$key] = $.extend({}, defaults, $options);

                    $form.attr('data-key', $key);
                    $form.attr('data-calx-enable', 1);
                    var $lang = calx.setLang($key);
                    calx.matrix[$key].lang = $lang;
                    calx.scan($form);
                } else {
                    calx.scan($form);
                }
            });
        },

        /** calculate the matrix and apply */
        update: function($formkey) {
            if (typeof($formkey) == 'undefined') {
                return this.each(function() {
                    var $form = $(this);
                    var $formkey = $form.attr('data-key');
                    calx.matrix[$formkey].update(true, calx.settings[$formkey].onupdate);
                });
            } else {
                calx.matrix[$formkey].update(true, calx.settings[$formkey].onupdate);
            }
        },

        /** rescan the form and recalculate matrix */
        refresh: function() {
            return this.each(function() {
                var $form = $(this);
                var $formkey = $form.attr('data-key');
                //calx.setLang($formkey);
                calx.scan($form);
                //calx.update($formkey);

            });
        },

        /** 
         * scan the form and build the calculation matrix
         * @param  {[type]} $form [description]
         * @return {[type]}       [description]
         */
        scan: function($form) {
            var $formkey = $form.attr('data-key');

            /** registering onChange event for affected elements */
            var registerEvent = function() {
                var $el = $(this);
                var $tag = $el.prop('tagName').toLowerCase();
                var $id = $el.attr('id');

                if (form_element.indexOf($tag) > -1) {
                    var $type = $el.attr('type');

                    $el.unbind('change').change(function() {
                        if ($type == 'checkbox') {
                            var $value_checked = $el.attr('value');
                            var $value_unchecked = $el.attr('data-unchecked');
                            $value_unchecked = ($value_unchecked) ? $value_unchecked : 0;

                            var $value = ($el.is(':checked')) ? $value_checked : $value_unchecked;
                            calx.matrix[$formkey].value[$id] = $.isNumeric($value) ? parseFloat($value) : $value;
                        } else if ($type == 'radio') {
                            var $name = $el.attr('name');
                            var $radiogroup = $('[name=' + $name + ']');

                            $radiogroup.each(function() {
                                var $r = $(this);
                                var $rid = $r.attr('id');
                                var $value_checked = $r.attr('value');
                                var $value_unchecked = $r.attr('data-unchecked');
                                $value_unchecked = ($value_unchecked) ? $value_unchecked : 0;

                                var $value = ($r.is(':checked')) ? $value_checked : $value_unchecked;
                                calx.matrix[$formkey].value[$rid] = $.isNumeric($value) ? parseFloat($value) : $value;
                            });
                        } else {
                            var $value = $el.val();
                            $value = ($value) ? utility.formatter().unformat($value) : $value;
                            if (calx.matrix[$formkey].data[$id].format.indexOf('%') > -1) {
                                calx.matrix[$formkey].value[$id] = parseFloat($value) / 100;
                            } else {
                                calx.matrix[$formkey].value[$id] = $.isNumeric($value) ? parseFloat($value) : $value;
                            }
                        }

                        calx.matrix[$formkey].update(calx.settings[$formkey].autocalculate, calx.settings[$formkey].onupdate);
                    });

                    if ($type == 'text') {
                        $el.unbind('blur,focus,change').focus(function() {
                            var $haveFormula = (typeof($el.attr('data-formula')) == 'undefined' || $el.attr('data-formula') === '') ? false : true;
                                
                            if (calx.matrix[$formkey].data[$id].format.indexOf('%') > -1) {
                                var $percent = (calx.matrix[$formkey].value[$id] * 100);
                                var $orivalue = ($percent % 1 > 0) ? $percent.toFixed(2) : $percent.toFixed(0);

                                if($haveFormula){
                                    $el.val($orivalue.toFixed(calx.settings[$formkey].round));
                                }else{
                                    $el.val($orivalue);
                                }
                            } else {
                                if($haveFormula){
                                    $el.val(calx.matrix[$formkey].value[$id].toFixed(calx.settings[$formkey].round));
                                }else{
                                    $el.val(calx.matrix[$formkey].value[$id]);
                                }
                            }

                        }).blur(function() {
                            var $value = $el.val();

                            if (!$.isNumeric($value)) {
                                $value = ($value) ? utility.formatter().unformat($value) : $value;
                            }

                            if (calx.matrix[$formkey].data[$id].format.indexOf('%') > -1) {
                                calx.matrix[$formkey].value[$id] = parseFloat($value) / 100;
                            } else {
                                calx.matrix[$formkey].value[$id] = $.isNumeric($value) ? parseFloat($value) : $value;
                            }
                            calx.setLang($formkey);
                            $el.val(utility.formatter(calx.matrix[$formkey].value[$id]).format(calx.matrix[$formkey].data[$id].format));
                        });
                    }
                }
            };

            /** register new found element to the calculation matrix */
            var registerMatrix = function() {
                var $this = $(this);
                var $id = $this.attr('id');
                var $formula = $this.attr('data-formula');
                var $placeholder = /\$\w+/g;
                var $dependency = [];
                var $value = '';

                /** scan cell dependency and register it to calculation matrix */
                var registerDependency = function() {
                    var match;
                    while (match = $placeholder.exec($formula)) {
                        var $key = match[0].replace('$', '');
                        if ($dependency.indexOf($key) < 0) {
                            $dependency.push($key);
                        }
                        if (calx.cell[$formkey].indexOf('#' + $key) < 0) {
                            calx.cell[$formkey].push('#' + $key);
                        }
                    }

                    var $regex = '(' + formula.member.join('|') + ')\\(([^(^)]*)\\)';
                    var $formula_regex = new RegExp($regex, 'g');
                    while (match = $formula_regex.exec($formula)) {
                        var $range = match[2].replace(/\$/g, '').split(',');
                        var $start = utility.translateCell($range[0]);
                        var $stop = utility.translateCell($range[1]);

                        for (col = $start.col; col <= $stop.col; col++) {
                            for (row = $start.row; row <= $stop.row; row++) {
                                var $rowIndex = utility.toChr(col) + row;
                                if ($dependency.indexOf($rowIndex) < 0) {
                                    $dependency.push($rowIndex);
                                }
                                if (calx.cell[$formkey].indexOf('#' + $rowIndex) < 0) {
                                    calx.cell[$formkey].push('#' + $rowIndex);
                                }
                            }
                        }
                    }
                };

                /** if cell is not registered in the matrix, in case of refreshing dynamic form, register it and it's dependencies! */
                if (typeof(calx.matrix[$formkey].data[$id]) == 'undefined') {
                    registerEvent.apply(this);

                    var $format = $this.attr('data-format');
                    $format = (typeof($format) == 'undefined' || $format === '') ? calx.settings[$formkey].format : $format;

                    var $tagname = $this.prop('tagName').toLowerCase();

                    if (form_element.indexOf($tagname) > -1) {
                        var $type = ($tagname == 'input' && typeof($this.attr('type')) != 'undefined') ? $this.attr('type').toLowerCase() : '';
                        if ($type == 'checkbox' || $type == 'radio') {
                            var $value_checked = $this.attr('value');
                            var $value_unchecked = $this.attr('data-unchecked');
                            $value_unchecked = ($value_unchecked) ? $value_unchecked : 0;

                            $value = ($this.is(':checked')) ? $value_checked : $value_unchecked;
                        } else {
                            $value = $this.val();
                            if ($value !== '' && typeof($value) !== 'undefined') {
                                calx.setLang($formkey);
                                $value = ($.isNumeric($value)) ? $value : utility.formatter().unformat($value);

                                $this.val(utility.formatter($value).format($format));
                            }
                        }
                    } else {
                        $value = $this.text();
                        if ($value !== '' && typeof($value) !== 'undefined') {
                            calx.setLang($formkey);
                            $value = ($.isNumeric($value)) ? $value : utility.formatter().unformat($value);

                            $this.html(utility.formatter($value).format($format));
                        }
                    }

                    /** scan for cell dependency by it's formula */
                    if ($formula) {
                        registerDependency();
                        if (calx.settings[$formkey].readonly) {
                            $this.attr('readonly', true).addClass('readonly');
                        }
                    }
                    /*if(calx.cell[$formkey].indexOf('#'+$id) < 0){
                    calx.cell[$formkey].push('#'+$id);
                    }*/

                    /** cache all info to matrix */
                    calx.matrix[$formkey].data[$id] = {
                        'updated': false,
                        'value': $value,
                        'id': $id,
                        'formula': $formula,
                        'format': $format,
                        'dependency': $dependency
                    };

                    calx.matrix[$formkey].value[$id] = $.isNumeric($value) ? parseFloat($value) : $value;

                    /** or if formula has been changed */
                } else if (calx.matrix[$formkey].data[$id].formula != $formula) {
                    if ($formula) {
                        registerDependency();
                        if (calx.settings[$formkey].readonly) {
                            $this.attr('readonly', true).addClass('readonly');
                        }
                        calx.matrix[$formkey].data[$id].formula = $formula;
                        calx.matrix[$formkey].data[$id].dependency = $dependency;

                    }

                    calx.matrix[$formkey].value[$id] = $.isNumeric($value) ? parseFloat($value) : $value;
                }
            };

            /** register all cells with data-formula attribute to the matrix */


            /** iterate matrix for removing cells which is not present in the dom */
            calx.matrix[$formkey].clean();

            var $resultContainer = $form.find('[data-formula]');
            $resultContainer.each(registerMatrix);

            /** register all cells involved within data-formula to the matrix */
            var $cells = $(calx.cell[$formkey].join(','));
            $cells.each(registerMatrix);

            /** register all cells with data-format attribute to the matrix */
            var $formattedCell = $form.find('[data-format]');
            $formattedCell.each(registerMatrix);

            //$cells.each(registerEvent); <-- moved inside registerMatrix
            if (calx.settings[$formkey].autocalculate) {
                calx.update($formkey);
            }
        },

        /** replace the parser with your own parser */
        parser: function(parser) {
            utility.parser = parser;
        },

        setLang: function($formkey) {
            if (typeof(calx.settings[$formkey].language) == 'object') {
                utility.formatter.language(calx.settings[$formkey].language.id);
                return calx.settings[$formkey].language.id;
            } else if (typeof(calx.settings[$formkey].language) == 'string') {
                utility.formatter.language(calx.settings[$formkey].language);
                return calx.settings[$formkey].language;
            }
        },

        /** add language settings */
        language: function($option) {
            if (typeof($option) == 'object') {
                utility.formatter.language($option.id, $option.config);
                if ($option.activate) {
                    utility.formatter.language($option.id);
                }
            } else if (typeof($option) == 'string') {
                utility.formatter.language($option);
            }
        },

        /** detach calx from the form */
        detach: function() {
            return this.each(function() {
                var $form = $(this);
                var $formkey = $form.attr('data-key');

                if ($formkey !== '') {
                    $.each(calx.matrix[$formkey].data, function($k, $v) {
                        $el = $('#' + $k);
                        $el.unbind('blur, focus, change');
                        if ($el.prop('tagName') == 'input') {
                            if ($el.attr('type') == 'text') {
                                if ($v.formula) {
                                    $el.val(calx.matrix[$formkey].value[$el.attr('id')]);
                                } else {
                                    $el.val('');
                                }
                            }
                        } else {
                            if ($v.formula) {
                                $el.html('');
                            } else {
                                $el.html(calx.matrix[$formkey].value[$el.attr('id')]);
                            }
                        }
                    });
                    delete calx.matrix[$formkey];
                    delete calx.cell[$formkey];
                    delete calx.settings[$formkey];

                    $form.attr('data-key', '');
                    $form.attr('data-calx-enable', '0');
                }
            });
        },

        value: function($cell) {
            var $form = $(this);
            var $formkey = $form.attr('data-key');
            if (typeof($cell) != 'undefined') {
                if ($formkey && calx.matrix[$formkey].data[$cell]) {
                    return calx.matrix[$formkey].value[$cell];
                } else {
                    return false;
                }
            } else {
                return calx.matrix[$formkey].value;
            }
        }
    };

    //method loader
    $.fn.calx = function($action, $options) {
        if (calx[$action]) {
            return calx[$action].apply(this, Array.prototype.slice.call(arguments, 1));
        } else if (typeof($action) == 'object' || typeof($action) == 'undefined') {
            return calx.init.apply(this, arguments);
        } else {
            $.error('Method ' + method + ' does not exist on jQuery.calx');
        }
    };

})(jQuery);