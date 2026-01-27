-- Fix thumbnail field to support base64 images
ALTER TABLE courses ALTER COLUMN thumbnail TYPE TEXT;
