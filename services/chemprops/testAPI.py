from nmChemPropsAPI import nmChemPropsAPI as nmCPAPI
nm = nmCPAPI("testnmid")
# case 1: uSMILES reported, uSMILES does not exist in ChemProps, uSMILES does not exist in unknowns
result = nm.searchPolymers({'ChemicalName': 'donotexist', 'Abbreviation':'dne', 'uSMILES': 'ccccccccccccccccccccccccccccccccccccccc7'})
# "Insert unknown polymer with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' to unknowns."

# case 2: uSMILES reported, uSMILES does not exist in ChemProps, uSMILES exists in unknowns, duplicate nmid
result = nm.searchPolymers({'ChemicalName': 'donotexist2', 'Abbreviation':'dne2', 'uSMILES': 'ccccccccccccccccccccccccccccccccccccccc7'})
# "The document with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' has multiple _inputname! 'donotexist2' is newly added!"
# "Apply $addToSet with value 'dne2' to _inputabbr of the polymer with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' in unknowns."
# "The document with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' has duplicate in _nmid! Check 'testnmid'!"

# case 3: uSMILES reported, uSMILES does not exist in ChemProps, uSMILES exists in unknowns, new nmid
nm = nmCPAPI("testnmid1")
result = nm.searchPolymers({'ChemicalName': 'donotexist', 'TradeName': 'trade', 'uSMILES': 'ccccccccccccccccccccccccccccccccccccccc7'})
# "Apply $addToSet with value 'trade' to _inputtrade of the polymer with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' in unknowns."
# "Apply $addToSet with value 'testnmid1' to _nmid of the polymer with _inputsmiles: 'ccccccccccccccccccccccccccccccccccccccc7' in unknowns."

# case 4: uSMILES not reported, ChemicalName does not exist in ChemProps, ChemicalName does not exist in unknowns
result = nm.searchPolymers({'ChemicalName': 'donotexist3'})
# "Insert unknown polymer with _inputname: 'donotexist3' to unknowns. No _inputsmiles reported."

# case 5: uSMILES not reported, ChemicalName does not exist in ChemProps, ChemicalName exists in unknowns, duplicate nmid
result = nm.searchPolymers({'ChemicalName': 'donotexist3'})
# "The document with _inputsmiles: N/A, _inputname: 'donotexist3' has duplicate nmid! Check 'testnmid1'!"

# case 6: uSMILES not reported, ChemicalName does not exist in ChemProps, ChemicalName exists in unknowns, newnmid
nm = nmCPAPI("testnmid2")
result = nm.searchPolymers({'ChemicalName': 'donotexist3', 'TradeName': 'trade3', 'Abbreviation': 'dne3'})
# "Apply $addToSet with value 'dne3' to _inputabbr of the polymer with _inputsmiles: N/A, _inputname: 'donotexist3' in unknowns."
# "Apply $addToSet with value 'trade3' to _inputtrade of the polymer with _inputsmiles: N/A, _inputname: 'donotexist3' in unknowns."
# "Apply $addToSet with value 'testnmid2' to _nmid of the polymer with _inputsmiles: N/A, _inputname: 'donotexist3' in unknowns."

# case 7: find a winning match, reported Abbreviation and TradeName not in ChemProps
result = nm.searchPolymers({'ChemicalName': 'Polyurethane', 'Abbreviation': 'ignoreME', 'TradeName': 'ignoreME!'})
# "Admins please check whether 'ignoreME' is the abbreviation of polymer 'Polyurethane'."
# "Admins please check whether 'ignoreME!' is the tradename of polymer 'Polyurethane'."

# case 8: find a winning match, regular case
result = nm.searchPolymers({'ChemicalName': 'epoxy', 'Abbreviation':'DGEBA'})
# {
#  _id: "C(C(O)COC1=CC=C(C=C1)C(C)(C)C2=CC=C(O[*])C=C2)[*]",
# _stdname: "DGEBA Epoxy Resin"
# ...
# }
print(result)