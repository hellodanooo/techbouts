import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { getFirestore, collection, query, where, getDocs } from 'firebase/firestore';
import { GymProfile } from '@/utils/types';
import _ from 'lodash';

interface FighterFormData {
  first: string;
  last: string;
  email: string;
  dob: string;
  gym: string;
  age: number;
  weightclass: number;
  pmt_id: string;
  win: number;
  loss: number;
  gender: string;
  years_exp: number;
  other: string;
  ammy: number;
  height: number;
  heightFoot: number;
  heightInch: number;
  phone: string;
  coach_phone: string;
  coach_name: string;
}

interface FighterFormProps {
  initialData: Partial<FighterFormData>;
  onFormDataChange: (updatedData: Partial<FighterFormData>) => void;
}

const defaultFormData: FighterFormData = {
  first: '',
  last: '',
  email: '',
  dob: '',
  gym: '',
  age: 0,
  weightclass: 0,
  pmt_id: '',
  win: 0,
  loss: 0,
  gender: '',
  other: '',
  years_exp: 0,
  ammy: 0,
  height: 0,
  heightFoot: 0,
  heightInch: 0,
  phone: '',
  coach_phone: '',
  coach_name: '',
};

const EditFighterForm: React.FC<FighterFormProps> = ({ initialData, onFormDataChange }) => {
  const mergedInitialData = { ...defaultFormData, ...initialData };
  const [formData, setFormData] = useState<FighterFormData>(mergedInitialData);
  const [gymSearchTerm, setGymSearchTerm] = useState<string>(mergedInitialData.gym || '');
  const [gymSearchResults, setGymSearchResults] = useState<GymProfile[]>([]);
  const [dobError, setDobError] = useState<string | null>(null);
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

  useEffect(() => {
    const mergedData = { ...defaultFormData, ...initialData };
    setFormData(mergedData);
    setGymSearchTerm(mergedData.gym || '');
  }, [initialData]);

  // Create a memoized version of the debounced function
  const debouncedFetchGyms = useMemo(
    () => _.debounce(async (searchTerm: string) => {
      if (searchTerm.length >= 3) {
        const db = getFirestore();
        const gymCollections = ['gym_profiles_CA', 'gym_profiles_CO', 'gym_profiles_NV', 'gym_profiles_TX'];
        const queries = gymCollections.map(colName => {
          const colRef = collection(db, colName);
          const gymsQuery = query(colRef, where('gym', '>=', searchTerm), where('gym', '<=', searchTerm + '\uf8ff'));
          return getDocs(gymsQuery);
        });

        try {
          const querySnapshots = await Promise.all(queries);
          const gyms = querySnapshots.flatMap(snapshot => 
            snapshot.docs.map(doc => ({ 
              id: doc.id, 
              ...doc.data() 
            } as GymProfile))
          );
          setGymSearchResults(gyms);
        } catch (error) {
          console.error("Error fetching gyms: ", error);
          setGymSearchResults([]);
        }
      } else {
        setGymSearchResults([]);
      }
    }, 300),
    []
  );

  // Now create a wrapper function using useCallback that calls the debounced function
  const fetchGyms = useCallback((searchTerm: string) => {
    debouncedFetchGyms(searchTerm);
  }, [debouncedFetchGyms]);

  const handleGymSelect = (gym: GymProfile) => {
    setGymSearchTerm(gym.gym.toUpperCase());
    const updatedFormData = {
      ...formData,
      gym: gym.gym,
      coach_name: gym.coach_name ? gym.coach_name.toUpperCase() : '',
      coach_phone: gym.coach_phone || '',
    };
    setFormData(updatedFormData);
    onFormDataChange(updatedFormData);
    setGymSearchResults([]);
  };

  useEffect(() => {
    fetchGyms(gymSearchTerm);
  }, [gymSearchTerm, fetchGyms]);

  const handleGymInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setGymSearchTerm(value.toUpperCase());
    setFormData(currentFormData => ({
      ...currentFormData,
      gym: value.toUpperCase(),
    }));
    onFormDataChange({ gym: value.toUpperCase() });
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const upperCaseValue = value.toUpperCase();

    const updatedFormData = {
      ...formData,
      [name]: upperCaseValue,
    };

    if (name === 'dob') {
      if (dateRegex.test(value)) {
        setDobError(null);
        updatedFormData.age = calculateAge(value);
        updatedFormData.pmt_id = generatePmtId(formData.first, formData.last, value);
      } else {
        setDobError("Please enter Birthday as MM/DD/YYYY");
      }
    }

    if (name === 'first' || name === 'last') {
      if (formData.first && formData.last && formData.dob) {
        updatedFormData.pmt_id = generatePmtId(
          name === 'first' ? upperCaseValue : formData.first, 
          name === 'last' ? upperCaseValue : formData.last, 
          formData.dob
        );
      }
    }

    setFormData(updatedFormData);
    onFormDataChange(updatedFormData);
  };

  const calculateAge = (dob: string): number => {
    const birthday = new Date(dob);
    const today = new Date();
    let age = today.getFullYear() - birthday.getFullYear();
    const m = today.getMonth() - birthday.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthday.getDate())) {
      age--;
    }
    return age;
  };

  const generatePmtId = (firstName: string, lastName: string, dob: string): string => {
    const [month, day, year] = dob.split('/');
    return `${firstName.trim().replace(/\s/g, '').toUpperCase()}${lastName.trim().replace(/\s/g, '').toUpperCase()}${day}${month}${year}`;
  };

  return (
    <form>
      <div className='form-content'>
        
        <input
          type="text"
          name="first"
          value={formData.first}
          onChange={handleInputChange}
          placeholder="FIRST NAME"
        />

        <input
          type="text"
          name="last"
          value={formData.last}
          onChange={handleInputChange}
          placeholder="LAST NAME"
        />

        <input
          type="text"
          name="gym"
          value={gymSearchTerm}
          onChange={handleGymInputChange}
          placeholder="GYM"
          required
        />
        {gymSearchResults.length > 0 && (
          <ul style={{ listStyleType: 'none', padding: 0, textAlign:'center' }}>
            {gymSearchResults.map((gym, index) => (
              <li key={index} style={{ cursor: 'pointer', border: '2px solid green', marginTop: '5px', padding: '2px', borderRadius: '3px' }} onClick={() => handleGymSelect(gym)}>
                {gym.gym}
              </li>
            ))}
          </ul>
        )}

        <select
          name="weightclass"
          value={formData.weightclass.toString()}
          onChange={handleInputChange}
          className="weightclass-selector"
          required
        >
          <option value="">Select Weight Class</option>
          <option value="60">60</option>
          <option value="70">70</option>
          <option value="80">80</option>
          <option value="90">90</option>
          <option value="100">100</option>
          <option value="110">110</option>
          <option value="120">120</option>
          <option value="130">130</option>
          <option value="140">140</option>
          <option value="150">150</option>
          <option value="160">160</option>
          <option value="170">170</option>
          <option value="180">180</option>
          <option value="190">190</option>
          <option value="200">200</option>
          <option value="215">215</option>
          <option value="230">230</option>
          <option value="300">300</option>
        </select>

        <p style={{ textDecoration: 'underline' }}>Height</p>

        <div style={{ display: 'flex', justifyContent: 'space-around' }}>
          <select
            name="heightFoot"
            value={formData.heightFoot.toString()}
            onChange={handleInputChange}
            className="weightclass-selector"
            required
          >
            <option value="0">Foot</option>
            <option value="4">4 ft</option>
            <option value="5">5 ft</option>
            <option value="6">6 ft</option>
          </select>

          <select
            name="heightInch"
            value={formData.heightInch.toString()}
            onChange={handleInputChange}
            className="weightclass-selector"
            required
          >
            <option value="0">Inches</option>
            <option value="1">1</option>
            <option value="2">2</option>
            <option value="3">3</option>
            <option value="4">4</option>
            <option value="5">5</option>
            <option value="6">6</option>
            <option value="7">7</option>
            <option value="8">8</option>
            <option value="9">9</option>
            <option value="10">10</option>
            <option value="11">11</option>
          </select>
        </div>

        <select
          name="gender"
          value={formData.gender}
          onChange={handleInputChange}
          className="weightclass-selector"
          required
        >
          <option value="">Select Gender</option>
          <option value="MALE">Male</option>
          <option value="FEMALE">Female</option>
        </select>

        <input
          type="text"
          name="dob"
          value={formData.dob}
          onChange={handleInputChange}
          required
          onBlur={() => {
            if (!dateRegex.test(formData.dob) && formData.dob) {
              setDobError("Please enter Birthday as MM/DD/YYYY");
            } else {
              setDobError(null);
            }
          }}
          placeholder="MM/DD/YYYY"
        />
        {dobError && <p style={{ color: 'red' }}>{dobError}</p>}

        <p>Number of Amateur Full contact Fights</p>
        <select
          name="ammy"
          value={formData.ammy.toString()}
          onChange={handleInputChange}
          className="weightclass-selector"
          required
        >
          <option value="0">0</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5+</option>
        </select>

        <p>Years Training</p>
        <select
          name="years_exp"
          value={formData.years_exp.toString()}
          onChange={handleInputChange}
          className="weightclass-selector"
          required
        >
          <option value="0">Under a Year</option>
          <option value="1">1</option>
          <option value="2">2</option>
          <option value="3">3</option>
          <option value="4">4</option>
          <option value="5">5+</option>
        </select>

        <p style={{ textDecoration: 'underline' }}>Other experience (Amateur, Smokers, etc.)</p>
        <input
          type='string'
          value={formData.other}
          placeholder='OTHER'
          name='other'
          onChange={handleInputChange}
        />

        <input
          type="text"
          name="email"
          value={formData.email}
          onChange={handleInputChange}
          placeholder="EMAIL"
          required
        />

        <input
          type="tel"
          name="phone"
          value={formData.phone}
          onChange={handleInputChange}
          placeholder="PHONE NUMBER"
          required
        />

        <input
          type="text"
          name="coach_name"
          value={formData.coach_name}
          onChange={handleInputChange}
          placeholder="COACH NAME"
          required
        />

        <input
          type="tel"
          name="coach_phone"
          value={formData.coach_phone}
          onChange={handleInputChange}
          placeholder="COACH PHONE NUMBER"
          required
        />

        <p style={{ textDecoration: 'underline' }}>(autogenerated fields below)</p>
        <p>Age</p>
        <input
          type="number"
          readOnly
          value={formData.age}
          placeholder="AGE"
        />

        <input
          type="text"
          name="pmt_id"
          value={formData.pmt_id}
          readOnly
          placeholder="PMT ID"
        />
        <p>PMT Score</p>
        <input
          type="number"
          readOnly
          value={formData.win}
          placeholder="WIN"
        />

      </div>
    </form>
  );
};

export default EditFighterForm;