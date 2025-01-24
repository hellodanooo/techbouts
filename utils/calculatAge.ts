
export const calculateAge = (dob: string): number => {
    if (!dob) return 0;
  

    const dobParts = dob.split('/');
    if (dobParts.length !== 3) return 0;
  
    const birthDate = new Date(parseInt(dobParts[2]), parseInt(dobParts[0]) - 1, parseInt(dobParts[1]));
    const currentDate = new Date();
    let age = currentDate.getFullYear() - birthDate.getFullYear();
    const m = currentDate.getMonth() - birthDate.getMonth();
  
    if (m < 0 || (m === 0 && currentDate.getDate() < birthDate.getDate())) {
      age--;
    }
  
    return age;
  };