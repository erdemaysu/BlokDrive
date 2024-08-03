const axios = require('axios');

const PINATA_API_KEY = '069342493c5f255ac0be';
const PINATA_SECRET_API_KEY = '423a7bc40f1d2c687606115d7e583ec734b07cafb8ffdadbb8de24ef25e09a16';


const uploadToPinata = async (file) => {
  const formData = new FormData();
  formData.append('file', file);

  try {
    const response = await axios.post('https://api.pinata.cloud/pinning/pinFileToIPFS', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
        'pinata_api_key': PINATA_API_KEY,
        'pinata_secret_api_key': PINATA_SECRET_API_KEY
      }
    });

    return response.data.IpfsHash;
  } catch (error) {
    throw new Error('Error uploading file to Pinata: ' + error.message);
  }
};

const fetchFromPinata = async () => {
  
  try {
    const response = await axios.get('https://api.pinata.cloud/data/pinList?status=pinned', {
      headers: {
        'Content-Type': 'application/json',
        'pinata_api_key': PINATA_API_KEY , 
        'pinata_secret_api_key': PINATA_SECRET_API_KEY, 
      },
    });

    return response.data.rows;
      
  } catch (error) {
    console.error('Pinata dosya listesi alınırken hata oluştu:', error.message);
  }
};

const handleDelete = async (hash) => {
  try {
    const response = await fetch(`https://api.pinata.cloud/pinning/unpin/${hash}`, {
      method: 'DELETE',
      headers: {
        accept: 'application/json',
        'pinata_api_key': PINATA_API_KEY , 
        'pinata_secret_api_key': PINATA_SECRET_API_KEY,
      }
    });
  
    if (response.ok) {
      console.log(`Pin deleted successfully.`);
    } else {
      console.error(`Failed to delete pin.`);
    }
  } catch (error) {
    console.error(error);
  }
};


module.exports = {
  uploadToPinata,fetchFromPinata,handleDelete
};
