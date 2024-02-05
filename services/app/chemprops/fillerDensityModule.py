# adapted from filler_test.py by Sean Xiao
# Bingyin Hu, 03/25/2019
# Bingyin Hu, 11/12/2019 updated to python3
from urllib.request import urlopen, quote
from urllib.error import HTTPError
import requests
from bs4 import BeautifulSoup
import re
import urllib.request, urllib.parse, urllib.error

def removeNano(filler):
    words = filler.lower().split()
    exempt = {'nanotube', 'nanofiber'}
    if len(words) == 1:
        for i in exempt:
            if i in filler:
                if filler[-1] == 's':
                    return filler[:-1]
        return filler.replace('nano', '')
    else:
        output = []
        for w in words:
            if w.startswith('nano'):
                if w[-1] == 's':
                    w = w[:-1]
                if w not in exempt:
                    continue
                else:
                    output.append(w)
            else:
                output.append(w)
        return ' '.join(output)

def removeDescription(filler):
    words = filler.lower().split()
    des = {'function', 'platelet', 'synthetic', 'sheet', 'exfoliated', 'powder'}
    output = []
    for w in words:
        clean = True
        for d in des:
            if d in w:
                clean = False
                break
        if clean:
            output.append(w)
    return ' '.join(output)

def getFillerDensityGoogle(filler):
    url = 'https://cactus.nci.nih.gov/chemical/structure/' + quote(filler) + '/mw'
    try:
        raw_density = urlopen(url).read().decode('utf8')
        # Check if the status code is not 200
        if urlopen(url).getcode() != 200:
            raise ValueError("Invalid Chemical Name")
    except HTTPError as e:
        print(e)
        # Handle HTTP errors, e.g., 404 Not Found
        raise ValueError("Invalid Chemical Name")
    except Exception as e:
        # Handle other exceptions
        raise ValueError("Error: " + str(e))
    
    density_value = round(float(raw_density) / 100, 2)
    # headers = {'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/64.0.3282.186 Safari/537.36'}
    # query = urllib.parse.quote(removeDescription(removeNano(filler)) + " density")
    # print("query", query)
    # #r = requests.get('https://www.google.com/search?q='+ query, headers=headers)
    # r = requests.get('https://en.wikipedia.org/wiki/'+ filler, headers=headers)
    # print(r.url)
    # stdname = ''
    # soup = BeautifulSoup(r.text, 'html.parser')
    # snippet = soup.find('table', class_='infobox ib-chembox')
    # # print(snippet)
    # # Find the specific td element with the information about density
    # density_td = snippet.find_all('td')
    # print(density_td)

    # # If the td element is found, get the next sibling td which contains the density value
    # if density_td:
    #     density_value = density_td.find_next_sibling('td').text.strip()
    # clean_density = re.sub(r'[^\x00-\x7F]+','', density_value).strip()
    print(density_value)
    stdname = removeDescription(removeNano(filler)).lower().capitalize()
    # print(snippet)
    # if snippet is None:
    #     return (stdname, -1)
    # name = snippet.find('span', class_='GzssTd')
    # if name is not None and name.span is not None:
    #     stdname = re.sub(r'[^\x00-\x7F]+','',name.span.text).strip()
    # result = snippet.find('div', class_='Z0LcW')
    # if result is None:
    #     bs = snippet.find_all('b')
    #     for b in bs:
    #         if b.text.split()[0].replace('.','').isdigit():
    #             stdname = removeDescription(removeNano(filler)).lower().capitalize()
    #             return (stdname, b.text)
    #     return (stdname, -1)
    # clean_result = re.sub(r'[^\x00-\x7F]+','',result.text).strip()
    # clean_result = unitAdjust(clean_result)
    # # use capitalized filler as stdname if google don't have one
    # if stdname == '':
    #     stdname = removeDescription(removeNano(filler)).lower().capitalize()
    return (stdname, density_value)

# adjust possible density units to g/cm3
def unitAdjust(myStr):
    # google will always compose something like 'float ?g/?m' <sup> 3 </sup> is ignored. could be 'gm/cc'
    if '/' not in myStr or 'g' not in myStr.lower() or ('c' not in myStr.lower() and 'm' not in myStr.lower()):
        return myStr
    noDig = re.sub(r'[0-9,.]', '', myStr.lower()) # remove all digits and the decimal
    mass = noDig.split('/')[0].strip()
    volume = noDig.split('/')[-1].strip()
    if 'g' not in mass or ('c' not in volume and 'm' not in volume):
        return myStr
    try:
        density = float(myStr[:myStr.lower().find(mass)].strip())
    except:
        return myStr
    if mass == 'kg':
        density *= 1000.0
    elif mass == 'mg':
        density /= 1000.0
    elif mass == 'gm':
        density *= 1.0
    if volume == 'm':
        density /= 1000000.0
    elif volume == 'dm':
        density /= 1000.0
    elif volume == 'mm':
        density *= 1000.0
    elif volume == 'cc':
        density *= 1.0
    return str(density)

## test
if __name__ == '__main__':
    inputs = ['Aluminium dioxide', 'high abrasion furnace black', 'titanium dioxide', 'Graphite Nanoplatelets', 'HiPCO single-wall carbon nanotubes', 'carbon nanofibers', 'montmorillonite', 'sodium montmorillonite', 'silicon dioxide', 'graphite nanoplates', 'Synthetic fluorine mica', 'Sepiolite', 'cellulose nanowhiskers', 'silica nanoparticles', 'polyaniline', 'graphite oxide', 'cellulose nanocrystal', 'Al2O3', 'octyldimethylmethoxysilane', 'multi-walled carbon nanotubes', 'Iron Oxide - Barium Titanate core-shell nanoparticles', 'Carbon Black', 'anatase type nanosized titanium dioxide', 'multi-wall carbon nanotubes', 'single-walled carbon nanotubes', 'Titanium dioxide', 'graphene platelet', 'Alumina', 'graphene oxide', 'chloropropyldimethylethoxysilane', 'aluminum', 'Calcium Carbonate', 'expanded graphite', 'carbon nanotube', 'clay', 'SiC powder', 'Silver', 'graphite nanoplatelets', 'Functionalized graphene sheets', 'graphene platelets', 'calcium carbonate', 'Silver nitrate', 'graphene nanoplatelets', 'silver hexafluoroantimonate', 'Titanium Dioxide', 'functionalised multi-wall carbon nanotubes', 'montmorillonite K-10', 'graphite (as received)', 'alumina', 'reactive fluorine polyhedral oligomeric silsesquioxane', 'Iron (II,III) Oxide', 'magnesium oxide', 'Silica', 'silver', 'graphene', 'Ba0.7Sr0.3TiO3', 'cellulose nanocrystals', 'TiO2', 'carbon black', 'barium titanate', 'graphitic nanoplatelets', 'Zinc Oxide', 'ZnO', 'Montmorillonite', 'aminopropyldimethylethoxysilane', 'titania', 'Silicon dioxide', 'barium strontium titanate', 'Graphene Oxide', 'graphite', 'nanosilica', 'calcium copper titanate', 'zinc oxide', 'silica', 'exfoliated graphite nanoplatelets', 'Barium Titanate', 'zirconium dioxide']
    for i in inputs:
        print(getFillerDensityGoogle(i))
