(function() {
  var template = Handlebars.template, templates = Handlebars.templates = Handlebars.templates || {};
templates['error.hbs'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=container.escapeExpression;

  return "<p><i class=\"fa fa-exclamation-triangle\"></i>Error: \""
    + alias1(container.lambda(((stack1 = (depth0 != null ? depth0.xhr : depth0)) != null ? stack1.status : stack1), depth0))
    + " "
    + alias1(((helper = (helper = helpers.msg || (depth0 != null ? depth0.msg : depth0)) != null ? helper : helpers.helperMissing),(typeof helper === "function" ? helper.call(depth0 != null ? depth0 : {},{"name":"msg","hash":{},"data":data}) : helper)))
    + "\".</p>\n<p>There was an error with your search request. Please try again later.</p>\n";
},"useData":true});
templates['loading.hbs'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<i class=\"fa fa-refresh fa-spin fa-fw\"></i><span>Loading…</span>\n";
},"useData":true});
templates['no-results.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    return " for \""
    + container.escapeExpression(container.lambda(depth0, depth0))
    + "\"";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1;

  return "<p>No results found"
    + ((stack1 = helpers["if"].call(depth0 != null ? depth0 : {},depth0,{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + ".</p>\n";
},"useData":true});
templates['popular-artists.hbs'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    return "<p>Today's most popular artists:</p>\n";
},"useData":true});
templates['result-count-total.hbs'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>Showing all "
    + alias4(((helper = (helper = helpers.total || (depth0 != null ? depth0.total : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"total","hash":{},"data":data}) : helper)))
    + " results for: \""
    + alias4(((helper = (helper = helpers.term || (depth0 != null ? depth0.term : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"term","hash":{},"data":data}) : helper)))
    + "\".</p>\n";
},"useData":true});
templates['result-count.hbs'] = template({"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<p>Showing "
    + alias4(((helper = (helper = helpers.count || (depth0 != null ? depth0.count : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"count","hash":{},"data":data}) : helper)))
    + " of "
    + alias4(((helper = (helper = helpers.total || (depth0 != null ? depth0.total : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"total","hash":{},"data":data}) : helper)))
    + " results for: \""
    + alias4(((helper = (helper = helpers.term || (depth0 != null ? depth0.term : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"term","hash":{},"data":data}) : helper)))
    + "\".</p>\n";
},"useData":true});
templates['result.hbs'] = template({"1":function(container,depth0,helpers,partials,data) {
    return "            <div class=\"blurred\"></div>\n";
},"3":function(container,depth0,helpers,partials,data) {
    return "                <i class=\"fa fa-3x fa-user-circle\"></i>\n";
},"compiler":[7,">= 4.0.0"],"main":function(container,depth0,helpers,partials,data) {
    var stack1, helper, alias1=depth0 != null ? depth0 : {}, alias2=helpers.helperMissing, alias3="function", alias4=container.escapeExpression;

  return "<li class=\"item\">\n    <a href=\""
    + alias4(((helper = (helper = helpers.link || (depth0 != null ? depth0.link : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"link","hash":{},"data":data}) : helper)))
    + "\">\n"
    + ((stack1 = helpers["if"].call(alias1,(depth0 != null ? depth0.image : depth0),{"name":"if","hash":{},"fn":container.program(1, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        <div class=\"image-container\">\n"
    + ((stack1 = helpers.unless.call(alias1,(depth0 != null ? depth0.image : depth0),{"name":"unless","hash":{},"fn":container.program(3, data, 0),"inverse":container.noop,"data":data})) != null ? stack1 : "")
    + "        </div>\n        <div class=\"artist-name ellipsis\" title=\""
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "\">"
    + alias4(((helper = (helper = helpers.name || (depth0 != null ? depth0.name : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"name","hash":{},"data":data}) : helper)))
    + "</div>\n        <div class=\"attributes\">\n            <span title=\"Popularity\"><i class=\"fa "
    + alias4(((helper = (helper = helpers.popularityIcon || (depth0 != null ? depth0.popularityIcon : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"popularityIcon","hash":{},"data":data}) : helper)))
    + "\"></i>"
    + alias4(((helper = (helper = helpers.popularity || (depth0 != null ? depth0.popularity : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"popularity","hash":{},"data":data}) : helper)))
    + "</span>\n            <span title=\""
    + alias4(((helper = (helper = helpers.followersLabel || (depth0 != null ? depth0.followersLabel : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"followersLabel","hash":{},"data":data}) : helper)))
    + "\"><i class=\"fa fa-users\"></i>"
    + alias4(((helper = (helper = helpers.followersFormatted || (depth0 != null ? depth0.followersFormatted : depth0)) != null ? helper : alias2),(typeof helper === alias3 ? helper.call(alias1,{"name":"followersFormatted","hash":{},"data":data}) : helper)))
    + "</span>\n        </div>\n    </a>\n</li>\n";
},"useData":true});
})();