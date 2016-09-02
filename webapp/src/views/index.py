
'''
The main index page
'''

import os
import sys

# For importing other modules!
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '..'))
sys.path.append(path)

import pieces.page as page

'''
View the main index page
'''


def Render(db):

    p = page.Page(db)

    # Setup the page
    p.title = "PuckLab"
    p.content = "hello there"
    p.nav.title = "PuckLab"

    return p.render()
