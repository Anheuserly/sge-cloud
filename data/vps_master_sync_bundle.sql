-- ========================================================================================
--         AMCMEP & SGE-DATAHUB MASTER VPS DATABASE SYNC BUNDLE
--         Generated on 2026-08-14
-- ========================================================================================

CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- 1. USER PROFILES TABLE
CREATE TABLE IF NOT EXISTS user_profiles (
  user_id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  phone VARCHAR(50),
  email VARCHAR(255),
  active_role VARCHAR(100) DEFAULT 'customer',
  roles JSONB DEFAULT '["customer"]'::jsonb,
  partner_type VARCHAR(100),
  partner_status VARCHAR(50) DEFAULT 'active',
  partner_skills JSONB DEFAULT '[]'::jsonb,
  partner_service_areas JSONB DEFAULT '[]'::jsonb,
  business_ids JSONB DEFAULT '[]'::jsonb,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. AUTH ACCOUNTS TABLE
CREATE TABLE IF NOT EXISTS auth_accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR(255) REFERENCES user_profiles(user_id) ON DELETE CASCADE,
  phone VARCHAR(50),
  email VARCHAR(255),
  password_hash TEXT,
  password_setup_required BOOLEAN DEFAULT true,
  status VARCHAR(50) DEFAULT 'active',
  project_key TEXT DEFAULT 'amcmep',
  failed_attempts INTEGER DEFAULT 0,
  locked_until TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. BUSINESSES TABLE
CREATE TABLE IF NOT EXISTS businesses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  business_id VARCHAR(255),
  name VARCHAR(255) NOT NULL,
  kind VARCHAR(100) DEFAULT 'vendor',
  location VARCHAR(255),
  source_record_id VARCHAR(255),
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. PAYMENT CONFIGS TABLE
CREATE TABLE IF NOT EXISTS payment_configs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  active BOOLEAN DEFAULT true,
  project_key TEXT DEFAULT 'amcmep',
  owner_type VARCHAR(100) DEFAULT 'platform',
  owner_id TEXT DEFAULT 'official',
  display_name VARCHAR(255) DEFAULT 'Official payment account',
  upi_id VARCHAR(255),
  account_holder VARCHAR(255),
  account_number TEXT,
  ifsc VARCHAR(50),
  bank_name VARCHAR(255),
  qr_object_key TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

INSERT INTO payment_configs (id, project_key, owner_type, owner_id, display_name, upi_id, account_holder, account_number, ifsc, bank_name, qr_object_key, active, metadata, created_at, updated_at) VALUES (
  'fdfbf9a0-875b-4a9e-ba70-20ca547fe192', 'amcmep', 'platform', 'official', 'Official payment account', 'pos.5305155@indus', 'SHREE GANESH ENTERPRISES', '252502199866', 'INDB0000161', 'INDUSIND BANK', NULL, true, '{"$id":"6888c8d500033a37cb91","GST":"18","upiId":"pos.5305155@indus","currency":"INR","ifscCode":"INDB0000161","$sequence":"1","updatedAt":null,"$createdAt":"2025-07-29T13:12:54.825+00:00","$updatedAt":"2025-07-29T15:46:36.195+00:00","branchName":"Vasant Kunj Branch","$databaseId":"680b2cfb002805548743","accountName":"SHREE GANESH ENTERPRISES","$permissions":[],"merchantName":"SHREE GANESH ENTERPRISES","$collectionId":"6888bdc300110b2eecca","accountNumber":"252502199866","branchAddress":"Common Cause House, 5, Institutional Area, Nelson Mandela, New Delhi - 110070","paymentMethod":"UPI","paymentGatewayKey":"rzp_test_1234567890","paymentGatewaySecret":"secret_1234567890"}', '2025-07-29T13:12:54.825Z', '2025-07-29T15:46:36.195Z'
) ON CONFLICT (id) DO UPDATE SET active = EXCLUDED.active, metadata = EXCLUDED.metadata;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  'ecff9df9-c334-42b5-ad70-e5e19d429099', 'BSES', 'service provider', 'Delhi', '{"$id":"6a4cefb833245ec71661","city":"Delhi","name":"BSES","email":null,"phone":null,"state":null,"status":"active","address":null,"logoUrl":null,"pincode":null,"isActive":true,"services":[],"$sequence":"8","createdAt":"2026-07-07T12:23:20.209+00:00","gstNumber":null,"isDeleted":false,"updatedAt":"2026-07-07T12:23:20.209+00:00","$createdAt":"2026-07-07T12:23:22.069+00:00","$updatedAt":"2026-07-07T12:23:22.069+00:00","isVerified":false,"$databaseId":"680b2cfb002805548743","ownerUserId":"phone_919871936847","$permissions":["read(\"user:6a4cee6ea5dd83dfd12c\")","update(\"user:6a4cee6ea5dd83dfd12c\")","delete(\"user:6a4cee6ea5dd83dfd12c\")"],"businessType":"Service Provider","serviceAreas":[],"$collectionId":"businesses","vendorEnabled":false,"serviceEnabled":true,"receiveServiceRequests":true,"receiveProductRequirements":false}', '2026-07-07T12:23:22.069Z', '2026-07-07T12:23:22.069Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '9d7212bb-9f5f-4bf2-a825-60eed8bec5f0', 'mk digital marketing', 'service provider', 'south delhi', '{"$id":"6a4dd45b9f9c55c5ce40","city":"south delhi","name":"mk digital marketing","email":null,"phone":null,"state":null,"status":"active","address":null,"logoUrl":null,"pincode":null,"isActive":true,"services":[],"$sequence":"9","createdAt":"2026-07-08T04:38:51.653+00:00","gstNumber":null,"isDeleted":false,"updatedAt":"2026-07-08T04:38:51.653+00:00","$createdAt":"2026-07-08T04:38:53.124+00:00","$updatedAt":"2026-07-08T04:38:53.124+00:00","isVerified":false,"$databaseId":"680b2cfb002805548743","ownerUserId":"u17834854438006817","$permissions":["read(\"user:6a4dd3e29057416f3d33\")","update(\"user:6a4dd3e29057416f3d33\")","delete(\"user:6a4dd3e29057416f3d33\")"],"businessType":"Service Provider","serviceAreas":[],"$collectionId":"businesses","vendorEnabled":false,"serviceEnabled":true,"receiveServiceRequests":true,"receiveProductRequirements":false}', '2026-07-08T04:38:53.124Z', '2026-07-08T04:38:53.124Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  'fc4edaf5-63ab-4715-aeec-996b2a5cafcd', 'S N Enterprises', 'vendor', 'delhi', '{"$id":"6a5e771161b00abc9be1","city":"delhi","name":"S N Enterprises","email":null,"phone":null,"state":null,"status":"active","address":null,"logoUrl":null,"pincode":null,"isActive":true,"services":[],"$sequence":"10","createdAt":"2026-07-20T19:29:21.400+00:00","gstNumber":null,"isDeleted":false,"updatedAt":"2026-07-20T19:29:21.400+00:00","$createdAt":"2026-07-20T19:29:28.584+00:00","$updatedAt":"2026-07-20T19:29:28.584+00:00","isVerified":false,"$databaseId":"680b2cfb002805548743","ownerUserId":"shivnarayan_1784575505","owner_email":"shivnarayandelhi91@gmail.com","owner_phone":"+918744979804","$permissions":[],"businessType":"Vendor","serviceAreas":[],"$collectionId":"businesses","vendorEnabled":true,"serviceEnabled":false,"receiveServiceRequests":false,"receiveProductRequirements":true}', '2026-07-20T19:29:28.584Z', '2026-08-13T17:04:47.628Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '598f6ff4-b857-4e1d-a079-3f7f06ad0809', 'RVA Infratech Pvt Ltd', 'vendor', 'India', '{"source":"recovery_csv","category":"construction_infratech"}', '2026-08-13T17:03:00.677Z', '2026-08-13T17:04:47.626Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '33f08f9e-9c53-4f7c-a706-a6d34304cb1e', 'shree ganesh enterprises', 'service provider', 'delhi', '{"$id":"6a44e863b1e5d6c0648d","city":"delhi","name":"shree ganesh enterprises","email":null,"phone":null,"state":null,"source":"recovery_csv","status":"active","address":null,"logoUrl":null,"pincode":null,"isActive":true,"services":[],"$sequence":"7","createdAt":"2026-07-01T10:13:55.727+00:00","gstNumber":null,"isDeleted":false,"updatedAt":"2026-07-01T10:13:55.727+00:00","$createdAt":"2026-07-01T10:13:56.261+00:00","$updatedAt":"2026-07-01T10:13:56.261+00:00","isVerified":false,"$databaseId":"680b2cfb002805548743","ownerUserId":"6a440a2a4e6b9708e722","$permissions":["read(\"user:6a440a2a4e6b9708e722\")","update(\"user:6a440a2a4e6b9708e722\")","delete(\"user:6a440a2a4e6b9708e722\")"],"businessType":"Service Provider","serviceAreas":[],"$collectionId":"businesses","vendorEnabled":false,"serviceEnabled":true,"receiveServiceRequests":true,"receiveProductRequirements":false}', '2026-07-01T10:13:56.261Z', '2026-08-13T17:04:47.628Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  'f97526ce-accf-4c59-af06-bdb034ff37f2', 'MF MONTEX FORGE', 'vendor', 'New Delhi', '{"$id":"6a68702cd9251112dfb9","city":"New Delhi","name":"MF MONTEX FORGE","email":"montexforge26@gmail.com","phone":"+919892523483","state":"Delhi","status":"active","address":"10474, G. Floor, Gali No. 3, Bagichi Allauddin, Motia Khan, Pahar Ganj, New Delhi, 110055","logoUrl":null,"pincode":"110055","isActive":true,"services":["Buttweld fittings","Socketweld fittings","Threaded fittings","Flanges","Carbon steel","Alloy steel","Stainless steel"],"$sequence":"11","createdAt":"2026-07-28T09:02:34.952+00:00","gstNumber":"07AXKPR6245F1Z6","isDeleted":false,"updatedAt":"2026-07-28T09:02:34.952+00:00","$createdAt":"2026-07-28T09:02:36.892+00:00","$updatedAt":"2026-07-28T09:02:36.892+00:00","gst_number":"07AXKPR6245F1Z6","isVerified":false,"$databaseId":"680b2cfb002805548743","ownerUserId":"6a68702b9616721c828f","$permissions":[],"businessType":"Vendor","serviceAreas":["Delhi","New Delhi"],"$collectionId":"businesses","vendorEnabled":true,"serviceEnabled":false,"alternate_phone":"+919967045134","receiveServiceRequests":false,"receiveProductRequirements":true}', '2026-07-28T09:02:36.892Z', '2026-08-13T17:04:47.627Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '65d1bec7-bf68-4be9-ba37-4ced5597278c', 'Indus Tubes Limited', 'service provider', 'Delhi NCR', '{"phone":"+919625895639","source":"service_partners_csv","ownerUserId":"p17725184739039907","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '6f727869-e070-42bb-a7cd-d089ebab7ff3', 'sr engineering services', 'service provider', 'Delhi NCR', '{"phone":"+919654888844","source":"service_partners_csv","ownerUserId":"p17728623798563027","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '6d3d0d32-c9f6-4910-9a81-e6f7e3a4d2b7', 'gurukrupa brass industries', 'service provider', 'Delhi NCR', '{"phone":"+919106888174","source":"service_partners_csv","ownerUserId":"p17729609423765966","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '7ec29471-e511-4b39-8cf6-06e2b007fdf3', 'Fire Engineering Technology', 'service provider', 'Delhi NCR', '{"phone":"+919971365130","source":"service_partners_csv","ownerUserId":"p17734799680359006","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '643ef6d8-ef58-407e-a890-be7c5e403a28', 'k. paras fire system', 'service provider', 'Delhi NCR', '{"phone":"+919520127267","source":"service_partners_csv","ownerUserId":"p17737332230945151","businessType":"fire safely"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '31bcfd0b-a2ac-450a-82d9-0f8a98200328', 'AYZO International', 'service provider', 'Delhi NCR', '{"phone":"+919205556124","source":"service_partners_csv","ownerUserId":"p17750377101283519","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  '82d0df78-af01-4044-a819-cd93ec79a700', 'ases security', 'vendor', 'Delhi NCR', '{"phone":"+918619109067","source":"service_partners_csv","ownerUserId":"p17813367432768005","businessType":"Manufacturer"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  'dc3f167a-5d81-4b6d-9dd9-c4ad9bf08aba', 'S.S engineers & consultant', 'service provider', 'Delhi NCR', '{"phone":"+919625508773","source":"service_partners_csv","ownerUserId":"p17813530495053819","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO businesses (id, name, kind, location, metadata, created_at, updated_at) VALUES (
  'a4a90c29-c0aa-4b74-bfde-e2e4fdd2f834', 'om sai fire', 'service provider', 'Delhi NCR', '{"phone":"+917796739768","source":"service_partners_csv","ownerUserId":"p17822235900035605","businessType":"service_partner"}', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'c17845755051981', 'Shiv Narayan', '+918744979804', 'shivnarayandelhi91@gmail.com', 'business_owner', '["customer","business_owner","business_administrator","vendor"]'::jsonb, 'vendor', 'active', '{"city":"Delhi","state":"Delhi","source":"task_history; lib/features/home/home_chats_part.dart; lib/core/services/one_workspace_service.dart","company":"S N Enterprises","country":"India","pincode":null,"is_active":true,"gst_number":null,"recovery_id":"shiv_narayan_8744979804","country_code":"+91","address_line1":null,"business_name":"S N Enterprises","legacy_user_id":"c17845755051981","recovery_notes":"Business ownership and contact details were repeatedly confirmed. Review address and tax details before import.","alternate_phone":null,"profile_complete":true,"source_confidence":"high","record_completeness":"substantial","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.629Z', '2026-08-13T17:04:47.629Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'shyam_desai_9892523483', 'Shyam Desai', '+919892523483', 'montexforge26@gmail.com', 'business_owner', '["customer","business_owner","business_administrator","vendor","manufacturer","supplier"]'::jsonb, 'vendor', 'active', '{"city":"New Delhi","state":"Delhi","source":"task_history; supplied_business_card_image","company":"MF MONTEX FORGE","country":"India","pincode":"110055","is_active":true,"gst_number":"07AXKPR6245F1Z6","recovery_id":"shyam_desai_9892523483","country_code":"+91","address_line1":"10474, G. Floor, Gali No. 3, Bagichi Allauddin, Motia Khan, Pahar Ganj","business_name":"MF MONTEX FORGE","legacy_user_id":null,"recovery_notes":"Business card also uses Montex Forge Fittings. Password intentionally excluded.","alternate_phone":"+919967045134","profile_complete":true,"source_confidence":"high","record_completeness":"substantial","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.631Z', '2026-08-13T17:04:47.631Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  '698f7027e5c1825dec29', 'Shubham', '+918171486963', NULL, 'customer', '["customer"]'::jsonb, NULL, 'none', '{"city":null,"state":null,"source":"high","company":null,"country":"customer","pincode":"India","is_active":false,"gst_number":null,"recovery_id":"shubham_8171486963","country_code":"+91","address_line1":null,"business_name":null,"legacy_user_id":"698f7027e5c1825dec29","recovery_notes":null,"alternate_phone":null,"profile_complete":false,"source_confidence":"User explicitly stated this phone has no business. Do not attach notshubham.sge@gmail.com or any business to this record without fresh verification.","record_completeness":"task_history; request_screenshots; docs/contact_profile_auth_upgrade_plan.yaml","password_recovery_status":"partial"}'::jsonb, '2026-08-13T17:04:47.639Z', '2026-08-13T17:04:47.639Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'shubham_kumar_9315898869', 'Shubham Kumar', '+919315898869', 'notshubham.sge@gmail.com', 'customer', '["customer"]'::jsonb, NULL, 'none', '{"city":null,"state":null,"source":"task_history; profile_and_chat_screenshots; lib/features/home/home_profile_part.dart","company":null,"country":"India","pincode":null,"is_active":true,"gst_number":null,"recovery_id":"shubham_kumar_9315898869","country_code":"+91","address_line1":null,"business_name":null,"legacy_user_id":null,"recovery_notes":"User stated this email belongs to a different phone than +918171486963; screenshots associate the profile with +919315898869. Verify before activation.","alternate_phone":null,"profile_complete":false,"source_confidence":"medium","record_completeness":"partial","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.639Z', '2026-08-13T17:04:47.639Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'anil_saini_9871936847', 'Anil Saini', '+919871936847', NULL, 'business_administrator', '["customer","team_member","business_administrator"]'::jsonb, 'team_member', 'active', '{"city":null,"state":"Delhi","source":"task_history; business_and_request_screenshots","company":"shree ganesh enterprises","country":"India","pincode":"Delhi","is_active":true,"gst_number":null,"recovery_id":"anil_saini_9871936847","country_code":"+91","address_line1":null,"business_name":"shree ganesh enterprises","legacy_user_id":null,"recovery_notes":"Seen as a team member and business administrator. Business membership must be re-approved by the owner.","alternate_phone":null,"profile_complete":false,"source_confidence":"medium","record_completeness":"partial","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.640Z', '2026-08-13T17:04:47.640Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'panna_lal_partial', 'Panna Lal', '+919716944225', NULL, 'customer', '["customer"]'::jsonb, NULL, 'none', '{"city":null,"state":null,"source":"task_history; feed_screenshots","company":null,"country":"India","pincode":null,"is_active":true,"gst_number":null,"recovery_id":"panna_lal_partial","country_code":"+91","address_line1":null,"business_name":null,"legacy_user_id":null,"recovery_notes":"Historic feed identity only; no verified contact details survived.","alternate_phone":null,"profile_complete":false,"source_confidence":"low","record_completeness":"minimal","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.641Z', '2026-08-13T17:04:47.641Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'shashank_saini_partial', 'Shashank Saini', '+918527378555', NULL, 'partner', '["partner","service_provider"]'::jsonb, 'service_provider', 'unknown', '{"city":null,"state":null,"source":"task_history; assignment_and_chat_screenshots","company":null,"country":"India","pincode":null,"is_active":true,"gst_number":null,"recovery_id":"shashank_saini_partial","country_code":"+91","address_line1":null,"business_name":null,"legacy_user_id":null,"recovery_notes":"No verified phone or email survived. Historic assignment/chat identity only.","alternate_phone":null,"profile_complete":false,"source_confidence":"medium","record_completeness":"minimal","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.641Z', '2026-08-13T17:04:47.641Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918527389555', 'Tester', '+918527389555', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_916398854151', 'Priyanshu Maithani', '+916398854151', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919910402515', 'Rakesh Tiwari', '+919910402515', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917988655579', 'Dushyant', '+917988655579', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917011513450', 'Ishvar Rajbhar', '+917011513450', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919871936847', 'Amjad Hussain', '+919990127441', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'suhaib_partial', 'SUHAIB', '+918445572240', NULL, 'team_member', '["team_member","partner","service_provider"]'::jsonb, 'service_provider', 'unknown', '{"city":null,"state":null,"source":"task_history; business_and_chat_screenshots","company":"shree ganesh enterprises","country":"India","pincode":null,"is_active":true,"gst_number":null,"recovery_id":"suhaib_partial","country_code":"+91","address_line1":null,"business_name":"shree ganesh enterprises","legacy_user_id":null,"recovery_notes":"No verified phone or email survived. Match manually against a new registration before restoring membership.","alternate_phone":null,"profile_complete":false,"source_confidence":"medium","record_completeness":"minimal","password_recovery_status":"password_reset_required"}'::jsonb, '2026-08-13T17:04:47.640Z', '2026-08-13T17:04:47.640Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918700445381', 'Sohni', '+918700445381', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"f_QNMfYBTFOvj-CMIl5_P9:APA91bHTkJ71VhsmpuT3T4pvxfnLOYUDy5TpULu-mPYsIefGYrt78FwXuqZMZEtnPilzupsdnKkX1wtitNrFo4koQf_oI97qp5HtaFSHUlzsvPN8AFirHnw","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918954803948', 'Shubham Saini', '+918954803948', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"cui17G6qTfqItJtbwTmBWR:APA91bFPmeEmaR2eQLn9IkKJBvFqOJ4k-lQ9Q45Hjz1pQDZBJGLgCNltFwnFAaUkLgqfx7PP7GZS2WK3G-L5mikn20x8gEFI7GiXUXgqR_bEIEOs47VeBa0","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918864930368', 'Aabad Ali', '+918864930368', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917739277241', 'Kaushar', '+917739277241', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"cXEUzFutTS66WLalsLHIhX:APA91bGKoes-16jyIwmzE8tx_blWyQo8LPEK7b3re0zcVgTwEjMCZIPI6jD8X7rGGX19KFY7p-qeSeZEgt8693jF3hm0EPEL6lZOlQbx4Un8VqlYP-gqZDw","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919871474656', 'Ramnaresh', '+919871474656', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"dr_LDedlQ0et0O9dEGy6aK:APA91bHGo_qWbChNNVIIGTLKvsQXQfrDwNnTMbrXQ3URSKe_hW3bIbr0OnpEG84eq-ZPUrkbxowrn11x1VTV3aaGhALo8HgXB8zurMfUWd4JkOk_2IhzrQM","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919871490948', 'JK Lohia', '+919871490948', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"d5EFhOmhQ4Kk8yNR1ZSrGX:APA91bHcdUGhl__VVwT55avvt3pFmt_T7A30MxVoMsyGVrTkuXLXgDMy_ZtOSu_J-tDBp3wEqiwBd0Oh0xccozvf5_tDEq4YAn9m0ictvXM-RLvxB6wi7iU","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918755759057', 'Manoj Kumar', '+918755759057', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917037012203', 'Vikrant Saini', '+917037012203', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917617437445', 'usman', '+917617437445', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919572381286', 'Subash Gupta', '+919572381286', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918207428571', 'premnath sharma', '+918207428571', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_916207820535', 'Amit kumar verma', '+916207820535', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917500826492', 'Ravinder Singh Negi', '+917500826492', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":"cNV5hX9zSJ-68IfpHgCq3l:APA91bGlLOm2rxTR9bBrCNqSs7XtJMOveNXf8mANfGMZx8__kPfctkDIzrEPF3XwPstAp-SdFaaxf1JpcxxZ2MdLsqnFlhgMPVzvfB3Hq6tL9K3BI2AjWJ0","designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918683857960', 'Badalia Trading Company', '+918683857960', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917290022656', 'Brijesh Solankey', '+917290022656', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918700377154', 'md ayub', '+918700377154', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_916299384716', 'md shahid', '+916299384716', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_919355854012', 'Vinay Kanaujiya', '+919355854012', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_918449946291', 'TEHJEEB', '+918449946291', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'phone_917898507616', 'Hasan khan', '+917898507616', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'null', 'active', '{"source":"service_partners_csv","fcmToken":null,"designation":"Service Partner","partnerType":"null","businessName":"null"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17725184739039907', 'Indus Tubes Limited', '+919625895639', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"eRiJ7y26RY2BpgiTmvJg3P:APA91bFpLz-9zIQWUOZ_Cblm-aesgwDkpqXBX278OuMDcnnQ8dFtqYelk3rzdidseVMZGaeb1U2DnfaCxwIhAPkXbukh1FKVd0AddOn3s12yNzVPpc_KWdw","designation":"Service Partner","partnerType":"service_partner","businessName":"Indus Tubes Limited"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17725208918631822', 'Akash Gupta', '+919810067845', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'manufacturer', 'active', '{"source":"service_partners_csv","fcmToken":"eRiJ7y26RY2BpgiTmvJg3P:APA91bFpLz-9zIQWUOZ_Cblm-aesgwDkpqXBX278OuMDcnnQ8dFtqYelk3rzdidseVMZGaeb1U2DnfaCxwIhAPkXbukh1FKVd0AddOn3s12yNzVPpc_KWdw","designation":"Service Partner","partnerType":"manufacturer","businessName":"Indus Tubes Limited"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17728623798563027', 'Anuj Sharma', '+919654888844', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"dz4PicOnQZirfoJbp1I-r5:APA91bHSQO-hhCZMOS3A3bqnzvfvD3HNwbWIS-2pXd2J_TE6Of2cKxCk1oB27K1Ecr5yuyWpJJwC2XR8fNRHkdkBaDJF4YLP2a28ql70qH_YFpbiriCazWI","designation":"Service Partner","partnerType":"service_partner","businessName":"sr engineering services"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17729609423765966', 'jenish patel', '+919106888174', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"eWLk1rSLTH2qLDgv-PppmZ:APA91bH6PdDWF7IDXRexrJWyYIFQIqo4YY-YFCHDHo9Bw_8AKdpfTK-WHg29C06v251TqO_oE6zn20eGl25bTE48rHS11azIM1ed8GUvvx1lTmj7fzOv1HE","designation":"Service Partner","partnerType":"service_partner","businessName":"gurukrupa brass industries"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17734799680359006', 'Fire Engineering Technology', '+919971365130', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"f32lUmFSSr6phU3IBzXYDD:APA91bH-O4O_yolYD_2j6YNyuWwTd7n1w8S82fUWOH5dX-jZT6Xl6vBlUzQUS8vDPZtZCPPrMMdfP-qeiUxjCLq9VvZiXS7anNETk4fB236j5IRBxjwxN8Q","designation":"Service Partner","partnerType":"service_partner","businessName":"Fire Engineering Technology"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17737332230945151', 'satendra kumar singh', '+919520127267', NULL, 'service_partner', '["service_partner","partner","[\"contractor\"]"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"c9cjhueGQymxEOWoCZlGCK:APA91bET6Xq5ZQTCL4IhrgJSc2HTutTC8RuGQX0eynbLR5W8ohRO0uuE-d6QZVLc6ypadtnNlirBivavMWTMEEbBmu5jsPJddFPGuXEijunS3onYAEB9f6o","designation":"[\"contractor\"]","partnerType":"service_partner","businessName":"k. paras fire system"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17750377101283519', 'Jay kishor tiwari', '+919205556124', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"cZ_LMESATbGKb3gqypcstw:APA91bGy-npiieL9OuDVwuxS3lpQ6aBXLqjI1AnxXmgccaY_X0cY7_dXaYkD_qzB_YYCjTuxdV_aIHU-nAq6gGUhTRf-Auik47_Umj84RDqp8pGOsXNJ9Ag","designation":"Service Partner","partnerType":"service_partner","businessName":"AYZO International"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17813367432768005', 'vishesh singh', '+918619109067', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'manufacturer', 'active', '{"source":"service_partners_csv","fcmToken":"dpqHSZyHQ52kBE-UArVW-C:APA91bEy4VqFh39Ji_RVmIdMRw2CqWauDDl4MGS-uiRVhwj5tlf3XWWD4i7lInVeBhumLUIq0BSiZomeqoG7llPJsh1yZ_AIpbr6WR65LPUubdNk8OQpq64","designation":"Service Partner","partnerType":"manufacturer","businessName":"ases security"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17813530495053819', 'manoj barick', '+919625508773', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"cohwl4RAQnWpVNHp4OUUCN:APA91bExTsLxmhTbuqwWY6k_0hRkwdHkgdNckcHmTk5FgC3bm3lBg3ECnGwk-VXRW8XcY5XbSvND-awqwzeLnn_LrwmnknHne1bT-kM7tsBqFMu7qJvVozM","designation":"Service Partner","partnerType":"service_partner","businessName":"S.S engineers & consultant"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO user_profiles (user_id, name, phone, email, active_role, roles, partner_type, partner_status, metadata, created_at, updated_at) VALUES (
  'p17822235900035605', 'santosh', '+917796739768', NULL, 'service_partner', '["service_partner","partner","service_partner"]'::jsonb, 'service_partner', 'active', '{"source":"service_partners_csv","fcmToken":"eMoGRIGMSsuxpfBUKebbGU:APA91bFlSi26UkSvoJ_cFhTYVYAt07fMxBdPwyAi7-Za48ldjjgf8XqOY4ywfvrpJCuOjMNn7Ry8lo3i2ChfrMljfdN8s-P_Pwvu9EBvDZKPkM2ZQdpCu1I","designation":"Service Partner","partnerType":"service_partner","businessName":"om sai fire"}'::jsonb, '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (user_id) DO UPDATE SET name = EXCLUDED.name, phone = COALESCE(user_profiles.phone, EXCLUDED.phone);

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '7b837ed4-14c9-414c-ad0d-680255c94e12', 'c17845755051981', '+918744979804', 'shivnarayandelhi91@gmail.com', true, 'active', '2026-08-13T17:04:47.630Z', '2026-08-13T17:04:47.630Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '5f4a2327-cb34-4392-a3b6-1e16d09a3d18', 'shyam_desai_9892523483', '+919892523483', 'montexforge26@gmail.com', true, 'active', '2026-08-13T17:04:47.638Z', '2026-08-13T17:04:47.638Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '8bcb9260-2e47-4184-aefd-e979b6bfed8a', '698f7027e5c1825dec29', '+918171486963', NULL, true, 'active', '2026-08-13T17:04:47.639Z', '2026-08-13T17:04:47.639Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'e14d9152-e834-4589-bd65-0e58bb7ce5ab', 'shubham_kumar_9315898869', '+919315898869', 'notshubham.sge@gmail.com', true, 'active', '2026-08-13T17:04:47.640Z', '2026-08-13T17:04:47.640Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '5fa986a9-8086-4a2d-9eac-3bc3544c5ebb', 'anil_saini_9871936847', '+919871936847', NULL, true, 'active', '2026-08-13T17:04:47.640Z', '2026-08-13T17:04:47.640Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '20a8c0d7-9769-4704-8d34-afe875557f81', 'phone_918700445381', '+918700445381', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '30385a28-5f8f-4fae-a36c-5b91ee577b13', 'phone_918954803948', '+918954803948', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '1bbfbc76-1174-4f2f-8338-e8cf2ac9bd47', 'phone_918864930368', '+918864930368', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '1508460d-a174-4f69-967d-75d8451917a1', 'phone_917739277241', '+917739277241', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '00d793b7-23e8-4a79-af5d-78e6fc2590cd', 'phone_919871474656', '+919871474656', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'ff2c938f-194a-4b5a-8c49-d34d41c5729a', 'phone_919871490948', '+919871490948', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '5ba2e2e1-e6e7-4254-9027-9a5641dac548', 'phone_918527389555', '+918527389555', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'fc6456f4-12cf-4acd-ba79-6e9093e4c5c4', 'phone_916398854151', '+916398854151', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '90000804-1b5e-4140-8202-e6f500a79f08', 'phone_919910402515', '+919910402515', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'a0f77f57-035f-4fdb-943d-d7684a751b64', 'phone_917988655579', '+917988655579', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '31076e9e-9f62-4675-9346-bbdd8ba72bad', 'phone_917011513450', '+917011513450', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'f3f467e2-d975-4276-b129-07587102470c', 'phone_919871936847', '+919990127441', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '52d6eea7-4fc5-4cfe-a677-2478b25fb5b8', 'phone_918755759057', '+918755759057', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'd21400af-276f-46e0-ab2b-2477a314c7fa', 'phone_917037012203', '+917037012203', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'ef03643f-e622-4591-a814-1d58771587bf', 'phone_917617437445', '+917617437445', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '46957ba0-118d-4444-a4b9-c06f67aeab83', 'phone_919572381286', '+919572381286', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '1b90cd54-b8ce-42e2-b0b8-b25ebe779765', 'phone_918207428571', '+918207428571', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '52ac95f3-a90c-4a57-93de-90f5d0dea3e3', 'phone_916207820535', '+916207820535', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'cc3f383b-7c04-412a-b500-4e2cdf519b07', 'phone_917500826492', '+917500826492', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '58339eea-b753-491c-92d9-6ca83371e9e5', 'phone_918683857960', '+918683857960', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '95ff45a0-05f2-46a4-8587-4c106315fe94', 'phone_917290022656', '+917290022656', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'a0d5a84e-3584-4ecb-8206-9d6efd363888', 'phone_918700377154', '+918700377154', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '00435d36-9bc1-49e3-91ba-15ddccd0bbc2', 'phone_916299384716', '+916299384716', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'f3d00924-2100-4bb7-80f9-31eecb1f0ac2', 'phone_919355854012', '+919355854012', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '42d553c5-fc25-4b54-ad2d-baceb81f3c0a', 'phone_918449946291', '+918449946291', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '1abf2113-2107-4414-8cdc-2e42a6af8827', 'phone_917898507616', '+917898507616', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '92281df1-fe30-4f8c-b7e3-241993d46f2d', 'p17725184739039907', '+919625895639', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '7bb285c2-3686-417f-9c0e-794d57302966', 'p17725208918631822', '+919810067845', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '93ae271f-5a53-4a31-aaba-532f87ecafdc', 'p17728623798563027', '+919654888844', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '9adc100b-98a7-4300-a86d-9efd96963dca', 'p17729609423765966', '+919106888174', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'b31b9837-431b-426c-a27b-90884542439e', 'p17734799680359006', '+919971365130', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'c7ce4e2d-0405-4ebf-8320-dcd94c94727f', 'p17737332230945151', '+919520127267', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '81c3e5ff-7907-4e3e-bc8d-a397a6688d79', 'p17750377101283519', '+919205556124', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '6bbfc42e-f2f8-4a9a-b4fe-e5efb5747e8b', 'p17813367432768005', '+918619109067', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '5e29eddc-59bc-46de-b84a-d828089b7824', 'p17813530495053819', '+919625508773', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  'a5cd3ab9-2cd5-4b71-aca7-69292035d0ba', 'p17822235900035605', '+917796739768', NULL, true, 'active', '2026-08-13T18:10:43.163Z', '2026-08-13T18:10:43.163Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '56e92196-e4af-4bcb-a27b-e9f57d902c52', 'shashank_saini_partial', '+918527378555', NULL, true, 'active', '2026-08-13T17:04:47.641Z', '2026-08-13T17:04:47.641Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '4a1b2fbd-78ad-4ea1-bcef-defeaa90ef15', 'panna_lal_partial', '+919716944225', NULL, true, 'active', '2026-08-13T17:04:47.642Z', '2026-08-13T17:04:47.642Z'
) ON CONFLICT (id) DO NOTHING;

INSERT INTO auth_accounts (id, user_id, phone, email, password_setup_required, status, created_at, updated_at) VALUES (
  '4ff7c56b-9e49-4aa3-952a-66bdbee8535f', 'suhaib_partial', '+918445572240', NULL, true, 'active', '2026-08-13T17:04:47.641Z', '2026-08-13T17:04:47.641Z'
) ON CONFLICT (id) DO NOTHING;

