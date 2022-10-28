#!/usr/bin/env python

# 08/19/2019 Bingyin Hu
# This module detects copolymer nomenclatures by IUPAC and returns a package
# of breakdowned pure polymer components

class copolymerBreaker():
    # initialize
    def __init__(self, rawName):
        self.rawName = rawName
        self.intermediateName = self.rawName # only make changes to this name
        self.output = set() # output a set of pure polymer names
        self.rmBrac()
        self.rpQualifiers() # replace qualifiers with '$' from intermediateName

    # reload the module with the newRawName
    def reload(self, newRawName):
        self.__init__(newRawName)
        print("copolymerBreaker module reload with '{}'.".format(newRawName))

    # remove poly and convert to lower case
    def rmPoly(self, polyname):
        if polyname.strip().lower()[:4] == "poly":
            return polyname.strip().lower()[4:]
        return polyname.strip().lower()

    # remove {}, []
    def rmBrac(self):
        self.intermediateName = self.intermediateName.replace('{','').replace('}','').replace('[','').replace(']','')

    # replace qualifiers with '$' for copolymer
    # qualifiers: -co- -stat- -ran- -alt- -per- -block- -b- -graft-
    # non-linear qualifiers: -blend- -comb- -compl- -cyclo- -branch- -net- -ipn-
    # -sipn- -star-
    def rpQualifiers(self):
        # prefix qualifiers
        prefix = {"cyclo-", "branch-", "net-", "star-"}
        # connective qualifiers
        connect = {"-co-", "-stat-", "-ran-", "-alt-", "-per-", "-block-",
                   "-b-", "-graft-", "-blend-", "-comb-", "-compl-", "-net-",
                   "-ipn-", "-sipn-"}
        # replace connective qualifiers first, then prefix qualifiers
        for q in connect:
            self.intermediateName = self.intermediateName.replace(q,'$')
        for q in prefix:
            self.intermediateName = self.intermediateName.replace(q,'$')

    # reset the module
    def reset(self):
        self.__init__(self.rawName)
        print("copolymerBreaker module reset done.")

    # remove unpaired parentheses
    def rmUnpairedPar(self, inputStr):
        index = []
        surplus = [] # for surplused ')'
        for i,char in enumerate(inputStr):
            if char == '(':
                index.append(i) # add to index
            elif char == ')':
                if len(index) > 0:
                    index.pop() # remove the counter-part from index
                else: # if there is no counter-part
                    surplus.append(i) # add to the surplus
        # whatever left in index and surplus, need to be removed
        remove = index + surplus + [-1, len(inputStr)] # add head and tail
        # if there is nothing in index and surplus, return inputStr
        if len(remove) == 2:
            return inputStr
        remove.sort()
        outputStr = "" # init outputStr
        for i in range(len(remove)-1):
            outputStr += inputStr[remove[i]+1:remove[i+1]]
        return outputStr

    # run the conversion script and generate output
    def run(self):
        components = self.intermediateName.split('$')
        for comp in components:
            # first remove poly
            comp = self.rmPoly(comp.strip())
            # then remove unpaired parentheses
            comp = self.rmUnpairedPar(comp)
            # add to output
            if len(comp) > 0:
                self.output.add(comp)

## TEST SECTION
if __name__ == '__main__':
    cB1 = copolymerBreaker("branch-poly[(1,4-divinylbenzene)-stat-styrene]")
    cB1.run()
    print(cB1.output)
    cB2 = copolymerBreaker("poly[styrene-b-(ethylene-ran-butylene)-b-styrene]")
    cB2.run()
    print(cB2.output)
    cB3 = copolymerBreaker("poly[chlorotrifluoroethylene-co-trifluoroethylene-co-(vinylidene fluoride)]")
    cB3.run()
    print(cB3.output)
    cB4 = copolymerBreaker("poly(2-vinyl pyridine)")
    cB4.run()
    print(cB4.output)
