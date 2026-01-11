import './styles/ProfilePic.css'; 

const ProfilePic = ({ profilePic, displayName, initials }) => {
  return (
    <div className="user-avatar">
      {profilePic ? (
        <img 
          src={profilePic} 
          alt={displayName} 
          className="user-avatar-image" 
        />
      ) : (
        <span className="user-avatar-initials">{initials}</span>
      )}
    </div>
  );
};

export default ProfilePic;