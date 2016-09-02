teamAbv = {
    "L.A": "LOS ANGELES KINGS",
    "ANA": "ANAHEIM DUCKS",
    "CAR": "CAROLINA HURRICANES",
    "MTL": "MONTREAL CANADIENS",
    "DET": "DETROIT RED WINGS",
    "COL": "COLORADO AVALANCHE",
    "NSH": "NASHVILLE PREDATORS",
    "BOS": "BOSTON BRUINS",
    "DAL": "DALLAS STARS",
    "PHI": "PHILADELPHIA FLYERS",
    "EDM": "EDMONTON OILERS",
    "STL": "ST. LOUIS BLUES",
    "MIN": "MINNESOTA WILD",
    "ATL": "ATLANTA THRASHERS",
    "N.J": "NEW JERSEY DEVILS",
    "VAN": "VANCOUVER CANUCKS",
    "TOR": "TORONTO MAPLE LEAFS",
    "PHX": "PHOENIX COYOTES",
    "OTT": "OTTAWA SENATORS",
    "FLA": "FLORIDA PANTHERS",
    "NYI": "NEW YORK ISLANDERS",
    "PIT": "PITTSBURGH PENGUINS",
    "WSH": "WASHINGTON CAPITALS",
    "T.B": "TAMPA BAY LIGHTNING",
    "CGY": "CALGARY FLAMES",
    "S.J": "SAN JOSE SHARKS",
    "CBJ": "COLUMBUS BLUE JACKETS",
    "NYR": "NEW YORK RANGERS",
    "CHI": "CHICAGO BLACKHAWKS",
    "BUF": "BUFFALO SABRES",
    "WPG": "WINNIPEG JETS",
    "ARI": "ARIZONA COYOTES"
}

altNames = {
    "CANADIENS MONTREAL": "MONTREAL CANADIENS"
}

teamConf = {
    "L.A": "WEST",
    "ANA": "WEST",
    "CAR": "EAST",
    "MTL": "EAST",
    "DET": "WEST",
    "COL": "WEST",
    "NSH": "WEST",
    "BOS": "EAST",
    "DAL": "WEST",
    "PHI": "EAST",
    "EDM": "WEST",
    "STL": "WEST",
    "MIN": "WEST",
    "ATL": "EAST",
    "N.J": "EAST",
    "VAN": "WEST",
    "TOR": "EAST",
    "PHX": "WEST",
    "OTT": "EAST",
    "FLA": "EAST",
    "NYI": "EAST",
    "PIT": "EAST",
    "WSH": "EAST",
    "T.B": "EAST",
    "CGY": "WEST",
    "S.J": "WEST",
    "CBJ": "WEST",
    "NYR": "EAST",
    "CHI": "WEST",
    "BUF": "EAST",
    "WPG": "EAST"
}

teamConfReAlign = {
    "L.A": "WEST",
    "ANA": "WEST",
    "CAR": "EAST",
    "MTL": "EAST",
    "DET": "EAST",
    "COL": "WEST",
    "NSH": "WEST",
    "BOS": "EAST",
    "DAL": "WEST",
    "PHI": "EAST",
    "EDM": "WEST",
    "STL": "WEST",
    "MIN": "WEST",
    "WPG": "WEST",
    "N.J": "EAST",
    "VAN": "WEST",
    "TOR": "EAST",
    "ARI": "WEST",
    "PHX": "WEST",
    "OTT": "EAST",
    "FLA": "EAST",
    "NYI": "EAST",
    "PIT": "EAST",
    "WSH": "EAST",
    "T.B": "EAST",
    "CGY": "WEST",
    "S.J": "WEST",
    "CBJ": "EAST",
    "NYR": "EAST",
    "CHI": "WEST",
    "BUF": "EAST"
}

teamDiv = {
    "L.A": "PAC",
    "ANA": "PAC",
    "CAR": "SW",
    "MTL": "NE",
    "DET": "CEN",
    "COL": "NW",
    "NSH": "CEN",
    "BOS": "NE",
    "DAL": "PAC",
    "PHI": "ATL",
    "EDM": "NW",
    "STL": "CEN",
    "MIN": "NW",
    "ATL": "SW",
    "N.J": "ATL",
    "VAN": "NW",
    "TOR": "NE",
    "PHX": "PAC",
    "OTT": "NE",
    "FLA": "SW",
    "NYI": "ATL",
    "PIT": "ATL",
    "WSH": "SW",
    "T.B": "SW",
    "CGY": "NW",
    "S.J": "PAC",
    "CBJ": "CEN",
    "NYR": "ATL",
    "CHI": "CEN",
    "BUF": "NE",
    "WPG": "ATL"
}

teamDivReAlign = {
    "L.A": "PAC",
    "ANA": "PAC",
    "CAR": "MET",
    "MTL": "ATL",
    "DET": "ATL",
    "COL": "CEN",
    "NSH": "CEN",
    "BOS": "ATL",
    "DAL": "CEN",
    "PHI": "MET",
    "EDM": "PAC",
    "STL": "CEN",
    "MIN": "CEN",
    "WPG": "CEN",
    "N.J": "MET",
    "VAN": "PAC",
    "TOR": "ATL",
    "ARI": "PAC",
    "PHX": "PAC",
    "OTT": "ATL",
    "FLA": "ATL",
    "NYI": "MET",
    "PIT": "MET",
    "WSH": "MET",
    "T.B": "ATL",
    "CGY": "PAC",
    "S.J": "PAC",
    "CBJ": "MET",
    "NYR": "MET",
    "CHI": "CEN",
    "BUF": "ATL"
}

def getTeamByName(name,season):

    team = dict()

    if (name in altNames):
        name = altNames[name]

    team['name'] = name

    print name
    
    for t in teamAbv:

        if (teamAbv[t] == name):
            team['abv'] = t
            break

    if(int(season) >= 2013):
        team['conf'] = teamConfReAlign[team['abv']]
        team['div'] = teamDivReAlign[team['abv']]
    else:
        team['conf'] = teamConf[team['abv']]
        team['div'] = teamDiv[team['abv']]
    
    return team

def getTeamByAbv(abv,season):

    team = dict()
    team['name'] = teamAbv[abv]
    team['abv'] = abv

    if(int(season) >= 2013):
        team['conf'] = teamConfReAlign[abv]
        team['div'] = teamDivReAlign[abv]
    else:
        team['conf'] = teamConf[abv]
        team['div'] = teamDiv[abv]
    
    return team