from fastapi.responses import HTMLResponse


# local swagger ui function
def attach_local_swagger(app, route: str = "/docs"):
    route_slash = route if route.endswith("/") else f"{route}/"

    @app.get(route, include_in_schema=False)
    def _custom_docs():
        html = f"""
<!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <title>{app.title} – API Docs</title>
    <link rel="stylesheet" href="/static/swagger/swagger-ui.css" />
    <style>html, body {{ height:100%; margin:0; }} #swagger-ui {{ height:100%; }}</style>
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="/static/swagger/swagger-ui-bundle.js"></script>
    <script src="/static/swagger/swagger-ui-standalone-preset.js"></script>
    <script>
      window.ui = SwaggerUIBundle({{
        url: '{app.openapi_url}',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: "StandaloneLayout",
        deepLinking: true,
        tryItOutEnabled: true,
        defaultModelsExpandDepth: -1
      }});
    </script>
  </body>
</html>
"""
        return HTMLResponse(html)

    @app.get(route_slash, include_in_schema=False)
    def _custom_docs_slash():
        return _custom_docs()