f=mails-jobids-C1-C10.tsv

perl extract-mails-jobids.pl < ./20160126/allvariants > $f
perl extract-mails-jobids.pl < ./20160201/M_campaignlist-20160201050953-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160221/M_campaignlist-20160221035738-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160305/campaign-20160305/M_campaignlist-20160305-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160314/M_campaignlist-20160314-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160403/campaign-20160403/M_campaignlist-20160403-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160405/campaign-20160405/M_campaignlist-20160405-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160415/campaign-20160415/M_campaignlist-20160415-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160425/campaign-20160425/M_campaignlist-20160425-allvariants.csv >> $f
perl extract-mails-jobids.pl < ./20160510/campaign-20160509-5000/M_campaignlist-20160510-allvariants.csv >> $f

perl extract-mails-jobids.pl < ./20160510/campaign-20160509-5000/M_intern-20160510-A.csv >> $f
