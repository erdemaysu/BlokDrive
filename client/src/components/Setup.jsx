import * as React from 'react';
import { useState, useEffect } from 'react';
import { uploadToPinata, fetchFromPinata, handleDelete } from './pinata-client';
import Web3 from 'web3';
import useEth from "../contexts/EthContext/useEth";
import "./setup.css"
import '@mui/material/icon';
import SendRoundedIcon from '@mui/icons-material/SendRounded';
import DownloadRoundedIcon from '@mui/icons-material/DownloadRounded';
import DeleteRoundedIcon from '@mui/icons-material/DeleteRounded';
import ImageList from '@mui/material/ImageList';
import ImageListItem from '@mui/material/ImageListItem';
import ImageListItemBar from '@mui/material/ImageListItemBar';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import FileUploadRoundedIcon from '@mui/icons-material/FileUploadRounded';
import Button from '@mui/material/Button';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import Snackbar from '@mui/material/Snackbar';
import MuiAlert from '@mui/material/Alert';
import Slide from '@mui/material/Slide';
import { IconButton } from '@mui/material';
import { styled, alpha } from '@mui/material/styles';
import { saveAs } from 'file-saver';

function TransitionRight(props) {
  return <Slide {...props} direction="right" />;
}

const Alert = React.forwardRef(function Alert(props, ref) {
  return <MuiAlert elevation={6} ref={ref} variant="filled" {...props} />;
});

const StyledMenu = styled((props) => (
  <Menu
    elevation={0}
    anchorOrigin={{
      vertical: 'bottom',
      horizontal: 'right',
    }}
    transformOrigin={{
      vertical: 'top',
      horizontal: 'right',
    }}
    {...props}
  />
))(({ theme }) => ({
  '& .MuiPaper-root': {
    borderRadius: 6,
    marginTop: theme.spacing(1),
    minWidth: 180,
    color:
      theme.palette.mode === 'light' ? 'rgb(55, 65, 81)' : theme.palette.grey[300],
    boxShadow:
      'rgb(255, 255, 255) 0px 0px 0px 0px, rgba(0, 0, 0, 0.05) 0px 0px 0px 1px, rgba(0, 0, 0, 0.1) 0px 10px 15px -3px, rgba(0, 0, 0, 0.05) 0px 4px 6px -2px',
    '& .MuiMenu-list': {
      padding: '4px 0',
    },
    '& .MuiMenuItem-root': {
      '& .MuiSvgIcon-root': {
        fontSize: 18,
        color: theme.palette.text.secondary,
        marginRight: theme.spacing(1.5),
      },
      '&:active': {
        backgroundColor: alpha(
          theme.palette.primary.main,
          theme.palette.action.selectedOpacity,
        ),
      },
    },
  },
}));


const Setup = () => {
  const container = document.getElementById('container');
  const [file, setFile] = useState(null);
  const [fileDetails, setFileDetails] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [account, setAccount] = useState("");
  const [receiver, setReceiver] = useState("");
  const [sharedFiles, setSharedFiles] = useState([]);
  const [shareHash, setShareHash] = useState("");
  const { state } = useEth();
  const [openNotify, setOpenNotify] = useState(false);
  const [chatData, setChatData] = useState({ sender: null, ipfsHash: null });
  const [senders, setSenders] = useState([]);
  
  
  useEffect(()=>{
    console.log(sharedFiles)
  },[sharedFiles])

  const detectCurrentProvider = () => {
    let provider;
    if (window.ethereum) {
      provider = window.ethereum;
    } else if (window.web3) {
      provider = window.web3.currentProvider;
    } else {
      console.log("Non-ethereum browser detected. You should install Metamask");
    }
    return provider;
  };

  const onConnect = async() => {
    try {
      const currentProvider = detectCurrentProvider();
      if(currentProvider) {
        await currentProvider.request({method: 'eth_requestAccounts'});
        const web3 = new Web3(currentProvider);
        const userAccount  =await web3.eth.getAccounts();
        const account = userAccount[0];
        setAccount(account);
        setIsConnected(true);
      }
    } catch(err) {
      console.log(err);
    }
  }

  const onDisconnect = () => {
    setIsConnected(false);
  }

  const handleSenderClick = (file) => {
    setChatData({ sender: file.sender, ipfsHash: file.ipfsHash });
  };

  const handleCloseChat = () => {
    setChatData({ sender: null, ipfsHash: null });
  };

  const handleSendMessage = (event) => {
    if (event.key === 'Enter' && event.target.value) {
      setReceiver(chatData.sender);
      setShareHash(event.target.value);
      shareFile(receiver, event.target.value);
      event.target.value = '';
    }
  };

  const captureFile = (event) => {
    const selectedFile = event.target.files[0];
    console.log(selectedFile);
    setFile(selectedFile);
  };

  const onSubmit = async (event) => {
    event.preventDefault();
    if (file) {
      try {
        await uploadToPinata(file);
        setOpenNotify(true);

      } catch (error) {
        console.error("Dosya Pinata'ya yüklenirken hata oluştu:", error);
      }
    } else {
      console.error("Hiç dosya seçilmedi.");
    }
  };

  useEffect(() => {
    const fetchDataFromPinata = async () => {
      try {
        const filesFromPinata = await fetchFromPinata();
        console.log(filesFromPinata);
        setFileDetails(filesFromPinata);
      } catch (error) {
        console.error("Pinata'dan dosya alınırken hata oluştu:", error);
      }
    };

    fetchDataFromPinata();
  }, []);


  const shareFile = async (receiver, shareHash) => {
    try {
      if (state.accounts && state.accounts[0]) {

        await state.contract.methods.shareFile(receiver, shareHash).send({ from: state.accounts[0] });
  
        fetchSharedFiles();

      } else {
        console.error("Metamask hesabı bulunamadı.");
      }
    } catch (error) {
      console.error("Dosya paylaşımı hatası:", error);
    }
  };

  const fetchSharedFiles = async () => {
    try {
      const files = await state.contract.methods.getSharedFiles().call({ from: state.accounts[0] });

      // Dosyalardan sender'ları alarak tekrar etmeyen şekilde sender dizisine ekleyelim
      const uniqueSenders = Array.from(new Set(files.map(file => file.sender)));

      // Şu anda bulunan senders'ları güncellemek için önceki senders'ları alıp yeni senders'ları ekleyelim
      setSenders(prevSenders => [...prevSenders, ...uniqueSenders]);
      setSharedFiles(files);
      
    } catch (error) {
      console.error("Paylaşılan dosyaları alma hatası:", error);
    }
  };

  useEffect(() => {
    fetchSharedFiles();
  }, [state.contract, state.accounts]);

  const changePageLogin = ()=>{

    container.classList.add("active");


  };
  const changePageUpload = ()=>{

    container.classList.remove("active");
    onDisconnect();

  };
  
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);

  const handleClick = (event, item) => {
    setAnchorEl(event.currentTarget);
    setSelectedItem(item);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setSelectedItem(null);
  };

  const getUserInput = async (promptText) => {
    return new Promise((resolve) => {
      const userInput = prompt(promptText);
      resolve(userInput);
    });
  };

  const handleSend = async (item) => {
    if (item) {
      setShareHash(item.ipfs_pin_hash);
      const receiverValue = await getUserInput('Alıcı cüzdan adresi:');
      setReceiver(receiverValue);
      shareFile(receiver, shareHash);
      handleClose();
    } else {
      console.error("Selected file is undefined");
    }
  };

  const handleDownload = async (selectedItem) => {
    if (selectedItem) {
      const url = `https://lime-peaceful-bear-711.mypinata.cloud/ipfs/${selectedItem.ipfs_pin_hash}`
      fetch(url)
            .then(response => response.blob())
            .then(blob => {
              saveAs(blob, selectedItem.metadata.name);
            });
            handleClose();
    } else {
      console.error('error');
    }
  };

  const handleOpenUri = async (selectedItem) => {
    if (selectedItem) {
      window.open(`https://lime-peaceful-bear-711.mypinata.cloud/ipfs/${selectedItem.ipfs_pin_hash}`, '_blank');
    } else {
      console.error('error');
    }
  };

  const handleCloseNotify = (reason) => {
    if (reason === 'clickaway') {
      return;
    }

    setOpenNotify(false);
  };

  const handleFileClick = async (ipfsHash) => {
    if (ipfsHash) {
      window.open(`https://lime-peaceful-bear-711.mypinata.cloud/ipfs/${ipfsHash}`, '_blank');
    } else {
      console.error('error');
    }
  };

  return(
    <div class="container" id="container">
      <Snackbar open={openNotify} autoHideDuration={4000} TransitionComponent={TransitionRight} onClose={handleCloseNotify}>
        <Alert severity="success" sx={{ width: '100%', fontSize:'12px' }}>
          İşlem Başarıyla Tamamlandı!
        </Alert>
      </Snackbar>
    <div class="form-container sign-up">
            <br />
            <h1>Dosya Yükle</h1>
            <div style={{ display: 'flex', alignItems: 'center' }}>
              <input type="file" id="file-input" onChange={(event) => captureFile(event)}
              style={{backgroundColor:'#68186e', border: '2px dashed', borderRadius:'10px'}}/>
              <IconButton sx={{height:'4rem'}} onClick={(event) => onSubmit(event)} ><FileUploadRoundedIcon fontSize='large' /></IconButton>
            </div>
            <hr style={{ margin: '1rem 0', width: '-webkit-fill-available' }}/>
            <h1>My Space</h1>
            <ImageList gap={8} spacing={10} sx={{ borderRadius:'10px',padding:'10px',backgroundColor:'whitesmoke',width: 500, height: 450, overflow: 'scroll', margin:'20px', boxShadow: '0 0 10px 5px #68186e'}} cols={3}>
      {fileDetails.map((item) => (
        <div className="custom" key={item.ipfs_pin_hash}>
        <ImageListItem key={item.ipfs_pin_hash}>
          <div
            style={{
              position: 'relative',
              cursor: 'pointer',
              borderRadius: '10px',
              overflow: 'hidden',
            }}
          >
            <img
              srcSet={`https://lime-peaceful-bear-711.mypinata.cloud/ipfs/${item.ipfs_pin_hash}?w=248&fit=crop&auto=format&dpr=2 2x`}
              src={`https://lime-peaceful-bear-711.mypinata.cloud/ipfs/${item.ipfs_pin_hash}?w=248&fit=crop&auto=format`}
              alt={item.metadata.name}
              style={{ width: '100%', height: 'auto', display: 'block', border: '5px solid', borderColor:'purple', borderRadius:'10px' }}
            />
            <div
              className={`overlay`}
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                width: '100%',
                height: '100%',
              }}
              onClick={() => handleOpenUri(item)}
            />
          </div>
          <ImageListItemBar
            title={item.metadata.name}
            style={{ borderRadius: '10px' }}
            actionIcon={
              <Button onClick={(event) => handleClick(event, item)}>
                <MoreVertIcon />
              </Button>
            }
          />
        </ImageListItem>
      
      <StyledMenu 
        id="demo-customized-menu"
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleClose}
      >
        <MenuItem onClick={() => handleSend(selectedItem)}>
          <SendRoundedIcon />
          Send
        </MenuItem>
        <MenuItem onClick={() => handleDownload(selectedItem)}>
          <DownloadRoundedIcon />
          Download
        </MenuItem>
        <MenuItem onClick={() => handleDelete(selectedItem.ipfs_pin_hash).then(handleClose()).then(setOpenNotify(true))}>
          <DeleteRoundedIcon />
          Delete
        </MenuItem>
      </StyledMenu>
      </div>
      ))}
      
    </ImageList>
    </div>
  
    <div class="form-container sign-in">
    </div>
    <div class="toggle-container">
        <div class="toggle">
            <div class="toggle-panel toggle-left">
            <h1>Sohbetler</h1>
            <div>
    {sharedFiles.map((file, index) => (
      file.sender !== account && (
        <div
          key={index}
          onClick={() => handleSenderClick(file)}
          style={{
            cursor: 'pointer',
            border: '2px solid',
            padding: '10px',
            borderRadius: '10px',
            margin: '20px'
          }}
        >
          <strong>Gönderen:</strong> {file.sender} <br />
        </div>
      )
    ))}

    {chatData.sender && (
      <div
        style={{
          position: 'fixed',
          top: '50%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '10px',
          boxShadow: '0 0 10px rgba(0, 0, 0, 0.5)',
          width: '500px',
          height: '400px'
        }}
      >
        <div style={{ marginBottom: '10px', color: 'black' }}>
          <strong>Chat with: {chatData.sender}</strong>
        </div>
        <div
          style={{
            border: '1px solid #ccc',
            padding: '10px',
            borderRadius: '5px',
            height: 'calc(100% - 100px)',
            overflowY: 'scroll',
            marginBottom: '10px',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: '#f9f9f9'
          }}
        >
          {sharedFiles.map((file, index) => (
            <div
              key={index}
              onClick={() => handleFileClick(file.ipfsHash)}
              style={{
                backgroundColor: file.sender === account ? '#DCF8C6' : '#ECECEC',
                color: 'black',
                alignSelf: file.sender === account ? 'flex-end' : 'flex-start',
                padding: '10px',
                borderRadius: '10px',
                margin: '5px',
                maxWidth: '80%',
                wordBreak: 'break-word'
              }}
            >
              {file.ipfsHash}
            </div>
          ))}
        </div>
        <input
          type="text"
          placeholder="Mesaj ..."
          style={{
            width: '100%',
            padding: '10px',
            boxSizing: 'border-box',
            marginBottom: '10px'
          }}
          onKeyDown={handleSendMessage}
        />
        <button onClick={handleCloseChat} style={{ padding: '10px 20px' }}>
          Close
        </button>
      </div>
    )}
  </div>


          <button onClick={changePageUpload}>Çıkış</button>
            </div>
            <div class="toggle-panel toggle-right">
            <img className="logo-hd"src="logo-hd.png" alt=""/>
            {!isConnected && (
              <div>
                <p>
                  BlokDrive, dosyalarınızı güvenli bir şekilde depolamanıza ve blockchain ağı üzerinden paylaşmanıza olanak tanıyan bir sanal sürücü hizmetidir. IPFS (InterPlanetary File System) teknolojisi sayesinde dosyalarınız dağıtık bir şekilde depolanır ve blockchain ağının sağladığı güvenlik avantajlarıyla korunur.
                </p>
                <div>
                  <h1>Metamask</h1>
                  <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/3/36/MetaMask_Fox.svg/2048px-MetaMask_Fox.svg.png" alt="" />
                </div>
                <div>
                  <button onClick={onConnect}>
                    Giriş Yap
                  </button>
                </div>
              </div>
            )}
            {isConnected && (
              <div>
                <div>
                  <h2> Artık Hazırsınız !</h2>
                  <div>
                    <span>Cüzdan Adresi:</span> <br/>
                    {account}
                  </div>
                </div>
                <div>
                  <button onClick={onDisconnect}>
                  Çıkış Yap
                  </button>
                </div>
                <div>
                <button class="hidden" id="register" onClick={changePageLogin}>Devam Et</button>
                </div>
            </div>
            )}
            </div>
        </div>
    </div>
</div>
);
};
export default Setup;