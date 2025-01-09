// pages/components/FighterForm.tsx
// this component should create the fighter and pass to the root screen to submit to roster

'use client';

import React, { useState, useEffect } from 'react';


import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { format } from 'date-fns';
import { FighterFormData, GymProfile } from '@/utils/types';



interface FighterFormProps {
  onFormDataChange: (data: FighterFormData) => void;
}

const FighterForm: React.FC<FighterFormProps> = ({ onFormDataChange }) => {

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);

  const handleDateChange = (date: Date | null) => {
    if (date) {
      const formattedDate = format(date, 'MM/dd/yyyy');
      setFormData({
        ...formData,
        dob: formattedDate,
        age: calculateAge(formattedDate),
        mtp_id: formData.first && formData.last ? generatePmtId(formData.first, formData.last, formattedDate) : formData.mtp_id,
      });
      setSelectedDate(date);
      setDobError(null);
    } else {
      setDobError("Invalid date");
    }
  };


  const [formData, setFormData] = useState<FighterFormData>({
    first: '',
    last: '',
    email: '',
    dob: '',
    gym: '',
    age: 0,
    weightclass: 0,
    mtp_id: '',
    win: 0,
    loss: 0,
    mmaWin: 0,
    mmaLoss: 0,
    gender: '',
    other: '',
    years_exp: 0,
    height: 0,
    heightFoot: 0,
    heightInch: 0,
    phone: '',
    coach_phone: '',
    coach_name: '',
    gym_id: '',
    coach_email: '',
  });
  const [dobError, setDobError] = useState<string | null>(null);
  const dateRegex = /^(0[1-9]|1[0-2])\/(0[1-9]|[12][0-9]|3[01])\/\d{4}$/;

  //////////////////////////////////////////////////////////////////
  /////////////////// GYM SEARCH ///////////////////////////////////////////////
  const [gymSearchTerm, setGymSearchTerm] = useState<string>('');
  const [gymSearchResults, setGymSearchResults] = useState<GymProfile[]>([]);



  useEffect(() => {
    const fetchGyms = async () => {
      if (gymSearchTerm.length >= 3) {
        try {
          const response = await fetch(`/api/gyms?search=${encodeURIComponent(gymSearchTerm)}`);
          if (!response.ok) {
            throw new Error('Failed to fetch gyms');
          }
          const data = await response.json();
          setGymSearchResults(data.gyms);
        } catch (error) {
          console.error("Error fetching gyms:", error);
          setGymSearchResults([]);
        }
      } else {
        setGymSearchResults([]);
      }
    };

    // Add debounce to prevent too many API calls
    const timeoutId = setTimeout(() => {
      fetchGyms();
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [gymSearchTerm]);




  const handleGymInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setGymSearchTerm(value.toUpperCase());
    setFormData(currentFormData => ({
      ...currentFormData,
      gym: value.toUpperCase(),
    }));
  };

  const handleGymSelect = (gym: GymProfile) => {
    setGymSearchTerm(gym.gym.toUpperCase());
    setFormData({
      ...formData,
      gym: gym.gym,
      coach_name: gym.coach_name ? gym.coach_name.toUpperCase() : '',
      coach_phone: gym.coach_phone || '',
      coach_email: gym.coach_email || '',
    });
    setGymSearchResults([]);
  };




  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////



  //////////////////////////////////////////////////////////////////
  /////////////////// PMT_ID SEARCH ///////////////////////////////////////////////







  //////////////////////////////////////////////////////////////////
  //////////////////////////////////////////////////////////////////

  const generatePmtId = (firstName: string, lastName: string, dob: string): string => {
    const [month, day, year] = dob.split('/');
    return `${firstName.trim().replace(/\s/g, '').toUpperCase()}${lastName.trim().replace(/\s/g, '').toUpperCase()}${day}${month}${year}`;
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




  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    const upperCaseValue = value.toUpperCase();
  
    setFormData((currentFormData) => {
      const updatedFormData: FighterFormData = { ...currentFormData };
  
      if (name in updatedFormData) {
        const fieldName = name as keyof FighterFormData;
  
        // Handle numeric fields
        if (
          fieldName === 'weightclass' ||
          fieldName === 'age' ||
          fieldName === 'years_exp' ||
          fieldName === 'win' ||
          fieldName === 'loss' ||
          fieldName === 'mmaWin' ||
          fieldName === 'mmaLoss' ||
          fieldName === 'heightFoot' ||
          fieldName === 'heightInch'
        ) {
          updatedFormData[fieldName] = parseInt(value, 10) || 0;
        }
        // Handle DOB separately for additional logic
        else if (fieldName === 'dob') {
          updatedFormData.dob = value;
          if (dateRegex.test(value)) {
            updatedFormData.age = calculateAge(value);
            if (updatedFormData.first && updatedFormData.last) {
              updatedFormData.mtp_id = generatePmtId(
                updatedFormData.first.trim().replace(/\s/g, '').toUpperCase(),
                updatedFormData.last.trim().replace(/\s/g, '').toUpperCase(),
                value
              );
            }
          } else {
            setDobError('Date must be in MM/DD/YYYY format');
          }
        }
        // Handle string fields
        else if (typeof updatedFormData[fieldName] === 'string') {
          (updatedFormData[fieldName] as string) = upperCaseValue;
        }
  
        // Update `mtp_id` dynamically based on name and DOB
        if (fieldName === 'first' || fieldName === 'last') {
          if (updatedFormData.first && updatedFormData.last && updatedFormData.dob) {
            updatedFormData.mtp_id = generatePmtId(
              updatedFormData.first.trim().replace(/\s/g, '').toUpperCase(),
              updatedFormData.last.trim().replace(/\s/g, '').toUpperCase(),
              updatedFormData.dob
            );
          }
        }
      }
  
      onFormDataChange(updatedFormData);
      return updatedFormData;
    });
  };
  
  


  React.useEffect(() => {
    onFormDataChange(formData);
  }, [formData, onFormDataChange]);

  return (
    <form 
    style={{color:'black'}}
    >





      <div className='form-content'>
        <input
          type="text"
          name="first" // This should match the key in your state
          value={formData.first.toUpperCase()}
          onChange={handleInputChange}
          placeholder="FIRST NAME"
        />

        <input
          type="text"
          name="last" // This should match the key in your state
          value={formData.last.toUpperCase()}
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
          <ul style={{ listStyleType: 'none', padding: 0, textAlign: 'center' }}>
            {gymSearchResults.map((gym, index) => (
              <li key={index} style={{ cursor: 'pointer', border: '1px solid black', marginTop: '5px', padding: '1px', borderRadius: '3px' }} onClick={() => handleGymSelect(gym)}>
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
          <option value="65">65</option>
          <option value="70">70</option>
          <option value="75">75</option>
          <option value="80">80</option>
          <option value="85">85</option>
          <option value="90">90</option>
          <option value="95">95</option>
          <option value="100">100</option>
          <option value="108">108</option>
          <option value="112">112</option>
          <option value="117">117</option>
          <option value="122">122</option>
          <option value="127">127</option>
          <option value="132">132</option>
          <option value="170">137</option>
          <option value="137">180</option>
          <option value="142">142</option>
          <option value="147">147</option>
          <option value="153">153</option>
          <option value="159">159</option>
          <option value="165">165</option>
          <option value="172">172</option>
          <option value="179">179</option>
          <option value="179">179</option>
          <option value="186">186</option>
          <option value="195">195</option>
          <option value="215">215</option>
          <option value="235">235</option>
          <option value="300">HVY</option>

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
<br></br>
Birthday

        <DatePicker
          selected={selectedDate}
          onChange={handleDateChange}
          dateFormat="MM/dd/yyyy"
          placeholderText="MM/DD/YYYY"
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
        />
        {dobError && <p style={{ color: 'red' }}>{dobError}</p>}


        <br></br>
        Years Training

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



        <div style={{ display: 'flex', width:'100%', justifyContent:'space-evenly', border:'1px solid black', padding:'1%', borderRadius:'5px' }} className='recordContainer'>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center' }}>
            Win<br></br>
            Amateur Full Contact<br></br>
            Muay Thai

            <select
              name="win"
              value={formData.win.toString()}
              onChange={handleInputChange}
              className="weightclass-selector"
              required
            >
              <option value="0">0</option>
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
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="15">15+</option>

            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center' }}>
            Loss<br></br>
            Amateur Full Contact<br></br>
            Muay Thai
            <select
              name="loss"
              value={formData.loss.toString()}
              onChange={handleInputChange}
              className="weightclass-selector"
              required
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>

            </select>
          </div>

</div>

<div style={{ display: 'flex', width:'100%', justifyContent:'space-evenly', border:'1px solid black', padding:'1%', borderRadius:'5px' }} className='recordContainer'>

<div style={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center' }}>
            Win<br></br>
            Amateur Full Contact<br></br>
             MMA

            <select
              name="mmaWin"
              value={formData.mmaWin.toString()}
              onChange={handleInputChange}
              className="weightclass-selector"
              required
            >
              <option value="0">0</option>
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
              <option value="12">12</option>
              <option value="13">13</option>
              <option value="14">14</option>
              <option value="15">15+</option>

            </select>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', justifyContent:'center', alignItems:'center' }}>
            Loss<br></br>
            Amateur Full Contact<br></br>
            MMA
            <select
              name="mmaLoss"
              value={formData.mmaLoss.toString()}
              onChange={handleInputChange}
              className="weightclass-selector"
              required
            >
              <option value="0">0</option>
              <option value="1">1</option>
              <option value="2">2</option>
              <option value="3">3</option>
              <option value="4">4</option>
              <option value="5">5</option>
              <option value="6">6</option>
              <option value="7">7</option>
              <option value="8">8</option>
              <option value="9">9</option>

            </select>
          </div>


        </div>

        <p style={{ textDecoration: 'underline' }}>Other experience (Amateur, Smokers, etc.)</p>

        <input
          type='string'
          value={formData.other}
          placeholder='OTHER'
          name='other'
          onChange={handleInputChange}
        />

        <br></br>
        <p>Please enter IKF Fight Platform Email</p>
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

<input
          type="tel"
          name="coach_email"
          value={formData.coach_email}
          onChange={handleInputChange}
          placeholder="COACH EMAIL"
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
          style={{ display: 'none' }}
          type="text"
          name="mtp_id"
          value={formData.mtp_id}
          readOnly
          placeholder="MTP ID"
        />

        <p>Any questions? submit registration and reply to email</p>

      </div>

    </form>
  );
};

export default FighterForm;
