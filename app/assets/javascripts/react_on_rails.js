(function() {
  this.ReactOnRails = {};

  ReactOnRails.clientRenderReactComponent = function(options) {
    var componentName = options.componentName;
    var domId = options.domId;
    var propsVarName = options.propsVarName;
    var props = options.props;
    var trace = options.trace;
    var generatorFunction = options.generatorFunction;
    var expectTurboLinks = options.expectTurboLinks;

    this[propsVarName] = props;

    var renderIfDomNodePresent = function() {
      try {
        var domNode = document.getElementById(domId);
        if (domNode) {

          
          var reactElement = createReactElement(componentName, propsVarName, props,
            domId, trace, generatorFunction);
          provideClientReact().render(reactElement, domNode);
        }
      }
      catch (e) {
        ReactOnRails.handleError({
          e: e,
          componentName: componentName,
          serverSide: false,
        });
      }
    };

    var turbolinksInstalled = (typeof Turbolinks !== 'undefined');
    if (!expectTurboLinks || (!turbolinksInstalled && expectTurboLinks)) {
      if (expectTurboLinks) {
        console.warn('WARNING: NO TurboLinks detected in JS, but it is in your Gemfile');
      }

      document.addEventListener('DOMContentLoaded', function(event) {
        renderIfDomNodePresent();
      });
    } else {
      function onPageChange(event) {
        var removePageChangeListener = function() {
          document.removeEventListener('page:change', onPageChange);
          document.removeEventListener('page:before-unload', removePageChangeListener);
          var domNode = document.getElementById(domId);
          provideClientReact().unmountComponentAtNode(domNode);
        };

        document.addEventListener('page:before-unload', removePageChangeListener);

        renderIfDomNodePresent();
      }

      document.addEventListener('page:change', onPageChange);
    }
  };

  ReactOnRails.serverRenderReactComponent = function(options) {
    var componentName = options.componentName;
    var domId = options.domId;
    var propsVarName = options.propsVarName;
    var props = options.props;
    var trace = options.trace;
    var generatorFunction = options.generatorFunction;
    var location = options.location;

    var htmlResult = '';
    var consoleReplay = '';

    try {
      
                // JG: this is not necessarily going return a reactElement
          // We might get back object like { pathname, search, hash, state }, and a generator function, then we know
          // that we need to redirect, and allow the developer to provide a calback.
          
          
          // So we'll be doing window.location to the correct path, computed from the pathname, hash, search.
          
          // OR we can call the specified callback if there's a redirect.
          
          
          // We add a configuration, like the componentName: https://github.com/shakacode/react_on_rails#rails-view-helpers-in-depth
          // call the option: react_router_redirect_callback which takes the name of the server globally exposed
          // handler. The global function must have the form of:
          // myReactRouterServerCallback(routeRedirect)
          // routeRedirect is defined as containing:

    //       routeRedirect: {
    //         pathname: "Path <String>",
    //         search: "Query <String>",
    //         hash: "Hash <string>",
    //         state: "Custom State <Object>",  // this is what you setup to cause the redirect, 
    //         ...other stuff from reactRouter
    //        }
    //       redirectTo = routeRedirect.pathname + routeRedirect.search

// If the configuration is not provided, we simply do a window.location = path, as described above.

          // otherwise, we call this this code (no redirect)
      
      
      
      
      var reactElement = createReactElement(componentName, propsVarName, props,
        domId, trace, generatorFunction, location);
      htmlResult = provideServerReact().renderToString(reactElement);
    }
    catch (e) {
      htmlResult = ReactOnRails.handleError({
        e: e,
        componentName: componentName,
        serverSide: true,
      });
    }

    consoleReplay = ReactOnRails.buildConsoleReplay();
    return JSON.stringify([htmlResult, consoleReplay]);
  };

  // Passing either componentName or jsCode
  ReactOnRails.handleError = function(options) {
    var e = options.e;
    var componentName = options.componentName;
    var jsCode = options.jsCode;
    var serverSide = options.serverSide;

    var lineOne =
      'ERROR: You specified the option generator_function (could be in your defaults) to be\n';
    var lastLine =
      'A generator function takes a single arg of props and returns a ReactElement.';

    console.error('Exception in rendering!');

    var msg = '';
    if (componentName) {
      var shouldBeGeneratorError = lineOne +
        'false, but the React component \'' + componentName + '\' seems to be a generator function.\n' +
        lastLine;
      var reMatchShouldBeGeneratorError = /Can't add property context, object is not extensible/;
      if (reMatchShouldBeGeneratorError.test(e.message)) {
        msg += shouldBeGeneratorError + '\n\n';
        console.error(shouldBeGeneratorError);
      }

      var shouldBeGeneratorError = lineOne +
        'true, but the React component \'' + componentName + '\' is not a generator function.\n' +
        lastLine;
      var reMatchShouldNotBeGeneratorError = /Cannot call a class as a function/;
      if (reMatchShouldNotBeGeneratorError.test(e.message)) {
        msg += shouldBeGeneratorError + '\n\n';
        console.error(shouldBeGeneratorError);
      }
    }

    if (jsCode) {
      console.error('JS code was: ' + jsCode);
    }

    if (e.fileName) {
      console.error('location: ' + e.fileName + ':' + e.lineNumber);
    }

    console.error('message: ' + e.message);
    console.error('stack: ' + e.stack);
    if (serverSide) {
      msg += 'Exception in rendering!\n' +
        (e.fileName ? '\nlocation: ' + e.fileName + ':' + e.lineNumber : '') +
        '\nMessage: ' + e.message + '\n\n' + e.stack;
      var reactElement = React.createElement('pre', null, msg);
      return provideServerReact().renderToString(reactElement);
    }
  };

  ReactOnRails.buildConsoleReplay = function() {
    var consoleReplay = '';

    var history = console.history;
    if (history && history.length > 0) {
      consoleReplay += '\n<script>';
      history.forEach(function(msg) {
        consoleReplay += '\nconsole.' + msg.level + '.apply(console, ' +
          JSON.stringify(msg.arguments) + ');';
      });

      consoleReplay += '\n</script>';
    }

    return consoleReplay;
  };

  function createReactElement(componentName, propsVarName, props, domId, trace, generatorFunction, location) {
    if (trace) {
      console.log('RENDERED ' + componentName + ' with data_variable ' +
        propsVarName + ' to dom node with id: ' + domId);
    }

    if (generatorFunction) {
      return this[componentName](props, location);
    } else {
      return React.createElement(this[componentName], props);
    }
  }

  function provideClientReact() {
    if (typeof ReactDOM === 'undefined') {
      return React;
    }

    return ReactDOM;
  }

  function provideServerReact() {
    if (typeof ReactDOMServer === 'undefined') {
      return React;
    }

    return ReactDOMServer;
  }
}.call(this));
