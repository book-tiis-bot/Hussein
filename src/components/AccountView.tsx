// Habaynta iyo kaydinta Magaca iyo Sawirka cusub
  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setUpdatingProfile(true);
    setResetMessage(null);

    try {
      let avatarUrl = currentUser.avatar_url;

      // 1. Haddii uu sawir cusub doortay, ku shub Supabase Storage (avatars bucket)
      if (avatarFile) {
        const fileExt = avatarFile.name.split('.').pop();
        const fileName = `${currentUser.id}-${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('avatars')
          .upload(fileName, avatarFile, { upsert: true });

        if (uploadError) {
          throw new Error('Cillad sawirka upload-ka ah: ' + uploadError.message);
        }

        const { data: publicURLData } = supabase.storage
          .from('avatars')
          .getPublicUrl(fileName);

        avatarUrl = publicURLData.publicUrl;
      }

      // 2. Si toos ah u UPDATE garee miiska profiles adigoo isticmaalaya eq(id) halkii uu upsert noqon lahaa
      const { error: dbError } = await supabase
        .from('profiles')
        .update({
          full_name: fullName,
          avatar_url: avatarUrl,
          updated_at: new Date().toISOString(),
        })
        .eq('id', currentUser.id);

      if (dbError) throw dbError;

      // Nadiifi avatarFile
      setAvatarFile(null);

      // Si toos ah uga beddel preview-ga maxalliga ah si uusan u lumin
      setAvatarPreview(avatarUrl);

      setResetMessage('Xogta profaylka si guul leh ayaa loo kaydiyay! ✅');
      
      // Soo cusboonaysii xogta user-ka
      if (onRefreshProfile) {
        await onRefreshProfile();
      }
    } catch (err: any) {
      console.error("Cilladda Profaylka:", err);
      alert('Cillad ayaa dhacday: ' + (err.message || JSON.stringify(err)));
      setResetMessage('Cillad ayaa dhacday: ' + (err.message || 'Fadlan dib u day.'));
    } finally {
      setUpdatingProfile(false);
    }
  };
