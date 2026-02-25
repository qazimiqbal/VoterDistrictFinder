import React, { useEffect, useState, useCallback, useRef } from 'react';

interface VoterinfoProps {
    parcelID: string;
    myYear: number | null;
    // initialRender: boolean; // Receive the prop
}

const Voterinfo: React.FC<VoterinfoProps> = ({ parcelID, myYear }) => {
    const hasRendered = useRef(false); // Add a reference
    const [selectedYear, setSelectedYear] = useState(myYear); // Initialize with prop
    const [historicData, setHistoricData] = useState(null);
    const [profileData, setProfileData] = useState(null);
    const [error, setError] = useState(null);
    const [hasMounted, setHasMounted] = useState(false); // Track mount status

    useEffect(() => {
        if (!hasMounted) {
            setHasMounted(true); // Component has now mounted
            //alert("Year set to " + selectedYear); // Alert only on initial mount
        }
    }, []); // Empty dependency array ensures this runs only once after mount


    if (!hasRendered.current) {
         hasRendered.current = true;
    }
      const fetchData = useCallback(async (year, parcel) => {
        //alert("Inside fetch data Year = " + year+ " and ParcelID = " + parcel);
        try {
            const queryUrl = `https://gismaps.fultoncountyga.gov/arcgispub/rest/services/Temp/GlobalSearch_Dialog/MapServer/2/query?f=json&where=ParcelID='${parcel}' AND TaxYear=${year}&outFields=*`;
            console.log("Query URL: " + queryUrl);
            const response = await fetch(queryUrl);
            if (!response.ok) {
                throw new Error('Network response was not ok');
            }
            const Historicdata = await response.json();
            if (Historicdata.features && Historicdata.features.length > 0) {
                setHistoricData(Historicdata.features[0].attributes);
            } else {
                setError('No data found for the given Parcel ID.');
            }

            const zoningUrl = `https://gismaps.fultoncountyga.gov/arcgispub/rest/services/Temp/GlobalSearch_Dialog/MapServer/3/query?f=json&where=ParcelID='${parcel}'&outFields=*`;
            console.log("Zoning URL: " + zoningUrl);
            const zoningResponse = await fetch(zoningUrl);
            if (!zoningResponse.ok) {
                throw new Error('Network response was not ok');
            }
            const PropertyProfiledata = await zoningResponse.json();
            if (PropertyProfiledata.features && PropertyProfiledata.features.length > 0) {
                setProfileData(PropertyProfiledata.features[0].attributes);
            } else {
                setProfileData('No Profile data found.');
            }
            
        } catch (error) {
            setError(error.message);
        }
    }, []);


    useEffect(() => {
        if (parcelID && selectedYear) {
            fetchData(selectedYear, parcelID);
        } else {
            setHistoricData(null);
            setProfileData(null);
            setError(null);
        }
    }, [parcelID, selectedYear, fetchData]); // Dependencies are now parcelID, selectedYear, and fetchData

    if (error) {
        return <div>Error: {error}</div>;
    }

    if (!historicData || !profileData) {
        return <div>Loading...</div>;
    }
    const getFirstValue = (source: any, keys: string[]) => {
        for (const key of keys) {
            const value = source?.[key];
            if (value !== undefined && value !== null && `${value}`.trim() !== '') {
                return value;
            }
        }
        return 'N/A';
    };
 
    
    return (
        <div class="container">
        <div class="column">
          <div class="box">
            <div class="header">Voting Information</div>
            <div class="content">
            <table>
              <tr>
                  <td class="text-left">Parcel ID:</td><td class="text-rightcell">{historicData.ParcelID}</td>
              </tr> 
              <tr>
                  <td class="text-left">Parcel Address:</td><td class="text-rightcell">{historicData.Situs}</td>
              </tr> 
              <tr>
                  <td class="text-left">Owner:</td><td class="text-rightcell">{historicData.Owner}</td>
              </tr> 
              <tr>
                  <td class="text-left">Mailing Address:</td><td class="text-rightcell">{historicData.MailAddr}</td>
              </tr> 
              <tr>
                  <td class="text-left">County Precinct:</td><td class="text-rightcell">{getFirstValue(profileData, ['VPrecinct', 'CountyPrecinct'])}</td>
              </tr>
              <tr>
                  <td class="text-left">County Poll:</td><td class="text-rightcell">{getFirstValue(profileData, ['VPoll', 'CountyPoll'])}</td>
              </tr>
              <tr>
                  <td class="text-left">Muncipal Precinct:</td><td class="text-rightcell">{getFirstValue(profileData, ['MunicipalPrecinct', 'MuniPrecinct', 'MuncipalPrecinct'])}</td>
              </tr>
              <tr>
                  <td class="text-left">Muncipal Poll:</td><td class="text-rightcell">{getFirstValue(profileData, ['MunicipalPoll', 'MuniPoll', 'MuncipalPoll'])}</td>
              </tr>
              <tr>
                  <td class="text-left">Congressional District:</td><td class="text-rightcell">{profileData.CongDist}</td>
              </tr>
              <tr>
                  <td class="text-left">State Senate District:</td><td class="text-rightcell">{profileData.SenateDist}</td>
              </tr>
              <tr>
                  <td class="text-left">State House District:</td><td class="text-rightcell">{profileData.HouseDist}</td>
              </tr>
              <tr>
                  <td class="text-left">Commission District:</td><td class="text-rightcell">{profileData.CommDist}</td>
              </tr>
              <tr>
                  <td class="text-left">City Council District:</td><td class="text-rightcell">{profileData.CounclName}</td>
              </tr>
              <tr>
                  <td class="text-left">Fulton County School Board District:</td><td class="text-rightcell">{getFirstValue(profileData, ['FultonCountySchoolBoardDistrict', 'SchoolBoardDist', 'FCSchoolBoardDist'])}</td>
              </tr>
            </table>
            </div>
          </div>
        </div>   
    
      </div>  
    );

};

export default Voterinfo;