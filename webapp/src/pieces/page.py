
'''
Page is an object used for displaying a standard page
'''
import os
import jinja2

import os
import sys
import nav

from flask.ext.pymongo import PyMongo

# Setup the JINJA envronment
templatePath = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                            '..',
                                            '..',
                                            'templates'))

JINJA_ENVIRONMENT = jinja2.Environment(
    loader=jinja2.FileSystemLoader(templatePath),
    extensions=['jinja2.ext.autoescape'],
    autoescape=False)


class Page:

    def __init__(self, db):
        self.title = ""
        self.content = ""
        self.nav = nav.Nav(db)
        self.db = db
        self.script = ""
        self.data = ""
        self.styles = []
        self.d3 = False

    '''
    Render returns a string that can be sent back to a brower
    in the form of a web page
    '''

    def render(self):

        if(self.nav != None):
            nav = self.nav.render()
        else:
            nav = ""

        template_values = {
            'page': self,
            'nav': nav
        }

        template = JINJA_ENVIRONMENT.get_template('standard.html')

        return template.render(template_values)
