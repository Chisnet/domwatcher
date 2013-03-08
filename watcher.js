//Base JavaScript
var domwatcher = {};
domwatcher = (function() {
    var model = {};
    
    /* observerType could be one of many things:
     * mo - Mutation Observer
     * wo - WebKit Mutation Observer
     * dm - DOMAttrModified (Might be worth removing? Unreliable? IE9?)
     * pc - propertychange
     * to - setTimeout fallback (Not implemented)
    */
    var observerType = false;
    //Default observer config - we only care about attributes
    var mutationObserverConfig = { attributes:true };
    
    //Implementation of underscore's debounce function
    function debounce(func, wait) {
        var timeout, result;
        return function() {
            var context = this, args = arguments;
            var later = function() {
                timeout = null;
            };
            var callNow = !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) result = func.apply(context, args);
            return result;
        };
    }
    
    model.init = function(){
        //Find out what method we can use to detect changes and initialise anything for it
        if(typeof MutationObserver != 'undefined') {
            observerType = 'mo'
        }
        else if(typeof WebKitMutationObserver != 'undefined') {
            observerType = 'wo';
        }
        else if(typeof MutationEvent != 'undefined'){
            observerType = 'dm';
        }
        else if(typeof document.onpropertychange != 'undefined'){
            observerType = 'pc';
        }
        else {
            observerType = 'to';
        }
    }
    
    model.watch = function(element, callback) {
        switch(observerType) {
            case 'mo':
            case 'wo':
                //If it's a MutationObserver we need to initialise it (if it's not already being watched)
                if(!element.observer) {
                    if(observerType == 'mo') {
                        var mutationObserver = new MutationObserver(function(mutations){
                            mutations.forEach(function(mutation) {
                                callback();
                            });
                        });
                    } else {
                        var mutationObserver = new WebKitMutationObserver(function(mutations){
                            mutations.forEach(function(mutation) {
                                callback();
                            });
                        });
                    }
                    element.observer = mutationObserver;
                    mutationObserver.observe(element, mutationObserverConfig);
                }
                break;
            case 'dm':
                $(element).bind("DOMAttrModified", callback);
                break;
            case 'pc':
                var temp_callback = callback;
                $(element).bind("propertychange", debounce(temp_callback,25));
                break;
            case 'to':
                //TODO?
                break;
        }
    }
    
    model.neglect = function(element) {
        switch(observerType) {
            case 'mo':
            case 'wo':
                var mutationObserver = element.observer;
                if(mutationObserver) {
                    mutationObserver.disconnect();
                    element.observer = undefined;
                }
                break;
            case 'dm':
                $(element).unbind("DOMAttrModified");
                break;
            case 'pc':
                $(element).unbind("propertychange");
                break;
            case 'to':
                //TODO?
                break;
        }
    }
    
    return model;
}());
domwatcher.init();
//jQuery Plugin
(function($){
    var methods = {
        watch: function(callback) {
            return this.each(function(){
                domwatcher.watch(this, callback);
            });
        },
        neglect: function() {
            return this.each(function(){
                domwatcher.neglect(this);
            });
        }
    };
    $.fn.domwatcher = function(method) {
        if ( methods[method] ) {
            return methods[method].apply( this, Array.prototype.slice.call( arguments, 1 ));
        } else if ( typeof method === 'object' || ! method ) {
            return methods.init.apply( this, arguments );
        } else {
            $.error( 'Method ' +  method + ' does not exist on jQuery.domwatcher' );
        }  
    };
})(jQuery);