-- ============================================================================
-- IGNITE PORTAL - SUPABASE TRIGGERS SETUP SCRIPT
-- ============================================================================
-- Copy and paste this entire script into Supabase SQL Editor
-- Click RUN to create the triggers for data synchronization
-- ============================================================================

-- 1. Create a function that automatically updates all chats and messages
CREATE OR REPLACE FUNCTION sync_student_name_update()
RETURNS TRIGGER AS $$
BEGIN
  -- Sync Name if changed
  IF NEW.name <> OLD.name THEN
    UPDATE conversations SET student_name = NEW.name WHERE student_id = NEW.id;
    UPDATE conversations SET admin_name = NEW.name WHERE admin_id = NEW.id;
    UPDATE messages SET sender_name = NEW.name WHERE sender_id = NEW.id;
  END IF;

  -- Sync Profile Image if changed
  IF COALESCE(NEW.profile_image_url, '') <> COALESCE(OLD.profile_image_url, '') THEN
    UPDATE conversations SET student_image_url = NEW.profile_image_url WHERE student_id = NEW.id;
    UPDATE conversations SET admin_image_url = NEW.profile_image_url WHERE admin_id = NEW.id;
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 2. Attach the trigger to the students table
DROP TRIGGER IF EXISTS on_student_name_change ON students;

CREATE TRIGGER on_student_name_change
AFTER UPDATE OF name, profile_image_url ON students
FOR EACH ROW
EXECUTE FUNCTION sync_student_name_update();

-- ============================================================================
-- SUCCESS! Trigger has been created.
-- ============================================================================
