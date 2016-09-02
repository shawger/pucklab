import urllib2
import os
import time
from functools import wraps

# Some parameters
START_YEAR = 2014
END_YEAR = 2015
GAMES_PER_YEAR = 1230
GAMES_LOCKOUT = 720


def main():

    # Get the root dir of the project
    rootPath = os.path.abspath(os.path.join(os.path.dirname(__file__),
                                            '..'))

    getSummaries(rootPath)
    getRosters(rootPath)
    getPlayByPlay(rootPath)


def getPlayByPlay(rootPath):

    # Go through all the years
    currentYear = START_YEAR
    while(currentYear <= END_YEAR):

        seasonStr = str(currentYear) + str(currentYear + 1)

        # 2012 was a lockout year and had less games
        if(currentYear == 2012):
            games = 720
        else:
            games = 1230

        # Go through all the games that year
        i = 1
        while(i <= games):

            fileName = rootPath + "/rawHTML/playbyplay/" + \
                seasonStr + "_" + str(i) + ".HTM"

            # Only download if file does not exist
            if (not os.path.isfile(fileName)):

                url = "http://www.nhl.com/scores/htmlreports/%s/PL02%04d.HTM" \
                    % (seasonStr, i)

                print url
                urlSave(url, fileName)

            i += 1

        currentYear += 1


def getSummaries(rootPath):

    # Go through all the years
    currentYear = START_YEAR
    while(currentYear <= END_YEAR):

        seasonStr = str(currentYear) + str(currentYear + 1)

        # 2012 was a lockout year and had less games
        if(currentYear == 2012):
            games = 720
        else:
            games = 1230

        # Go through all the games that year
        i = 1
        while(i <= games):

            fileName = rootPath + "/rawHTML/summaries/" + \
                seasonStr + "_" + str(i) + ".HTM"

            # Only download if file does not exist
            if (not os.path.isfile(fileName)):

                url = "http://www.nhl.com/scores/htmlreports/%s/GS02%04d.HTM" \
                    % (seasonStr, i)

                print url
                urlSave(url, fileName)

            i += 1

        currentYear += 1


def getRosters(rootPath):

    # Go through all the years
    currentYear = START_YEAR
    while(currentYear <= END_YEAR):

        seasonStr = str(currentYear) + str(currentYear + 1)

        # 2012 was a lockout year and had less games
        if(currentYear == 2012):
            games = 720
        else:
            games = 1230

        # Go through all the games that year
        i = 1
        while(i <= games):

            fileName = rootPath + "/rawHTML/rosters/" + \
                seasonStr + "_" + str(i) + ".HTM"

            # Only download if file does not exist
            if (not os.path.isfile(fileName)):

                url = "http://www.nhl.com/scores/htmlreports/%s/RO02%04d.HTM" \
                    % (seasonStr, i)

                print url
                urlSave(url, fileName)

            i += 1

        currentYear += 1


def retry(ExceptionToCheck, tries=4, delay=3, backoff=2, logger=None):
    """Retry calling the decorated function using an exponential backoff.

    http://www.saltycrane.com/blog/2009/11/trying-out-retry-decorator-python/
    original from: http://wiki.python.org/moin/PythonDecoratorLibrary#Retry

    :param ExceptionToCheck: the exception to check. may be a tuple of
        exceptions to check
    :type ExceptionToCheck: Exception or tuple
    :param tries: number of times to try (not retry) before giving up
    :type tries: int
    :param delay: initial delay between retries in seconds
    :type delay: int
    :param backoff: backoff multiplier e.g. value of 2 will double the delay
        each retry
    :type backoff: int
    :param logger: logger to use. If None, print
    :type logger: logging.Logger instance
    """
    def deco_retry(f):

        @wraps(f)
        def f_retry(*args, **kwargs):
            mtries, mdelay = tries, delay
            while mtries > 1:
                try:
                    return f(*args, **kwargs)
                except ExceptionToCheck, e:
                    msg = "%s, Retrying in %d seconds..." % (str(e), mdelay)
                    if logger:
                        logger.warning(msg)
                    else:
                        print msg
                    time.sleep(mdelay)
                    mtries -= 1
                    mdelay *= backoff
            return f(*args, **kwargs)

        return f_retry  # true decorator

    return deco_retry


@retry(urllib2.URLError, tries=4, delay=3, backoff=2)
def urlSave(url, fileName):

    html = urllib2.urlopen(url)

    with open(fileName, "a") as fileWrite:
        fileWrite.write(html.read())


# Run the script
if __name__ == "__main__":
    main()
