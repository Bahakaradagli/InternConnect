CREATE TABLE insurance ( 
    insurance_no INT PRIMARY KEY, 
    insurance_company VARCHAR(50), 
    expire_date DATE 
)
;

CREATE TABLE diagnosis ( 
    diagnosis_id INT PRIMARY KEY, 
    diagnosis_name VARCHAR(100) NOT NULL 
)
;

CREATE TABLE payment_method ( 
    payment_method_id INT PRIMARY KEY, 
    method_name VARCHAR(50) NOT NULL 
)
;

CREATE TABLE payment_status ( 
    payment_status_id INT PRIMARY KEY, 
    status_name VARCHAR(50) NOT NULL 
)
;

CREATE TABLE departments ( 
    dept_id INT PRIMARY KEY, 
    dept_name VARCHAR(50) NOT NULL, 
    dept_block VARCHAR(20), 
    dept_floor VARCHAR(20) 
)
;

CREATE TABLE role_type ( 
    role_type_id INT PRIMARY KEY, 
    role_type_name VARCHAR(50) NOT NULL 
)
;

CREATE TABLE employee ( 
    emp_id INT PRIMARY KEY, 
    fname VARCHAR(50) NOT NULL, 
    lname VARCHAR(50) NOT NULL, 
    address VARCHAR(100), 
    phone_number VARCHAR(15), 
    salary DECIMAL(10, 2), 
    role_type_id INT, 
    dept_id INT, 
    FOREIGN KEY (role_type_id) REFERENCES role_type(role_type_id) ON DELETE CASCADE, 
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) ON DELETE CASCADE 
)
;

CREATE TABLE doctor ( 
    doctor_id INT PRIMARY KEY, 
    specialization VARCHAR(50), 
    emp_id INT, 
    FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE 
)
;

CREATE TABLE nurse ( 
    nurse_id INT PRIMARY KEY, 
    shift VARCHAR(20), 
    emp_id INT, 
    FOREIGN KEY (emp_id) REFERENCES employee(emp_id) ON DELETE CASCADE 
)
;

CREATE TABLE patient ( 
    patient_id INT PRIMARY KEY, 
    fname VARCHAR(50) NOT NULL, 
    lname VARCHAR(50) NOT NULL, 
    address VARCHAR(100), 
    phone_number VARCHAR(15), 
    age INT, 
    gender CHAR(1), 
    insurance_no INT UNIQUE, 
    FOREIGN KEY (insurance_no) REFERENCES insurance(insurance_no) 
)
;

CREATE TABLE appointment ( 
    appointment_id INT PRIMARY KEY, 
    patient_id INT, 
    doctor_id INT, 
    dept_id INT, 
    appointment_date TIMESTAMP, 
    status VARCHAR(50), 
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE, 
    FOREIGN KEY (doctor_id) REFERENCES doctor(doctor_id), 
    FOREIGN KEY (dept_id) REFERENCES departments(dept_id) 
)
;

CREATE TABLE bill ( 
    bill_id INT PRIMARY KEY, 
    patient_id INT, 
    amount DECIMAL(10, 2), 
    issue_date TIMESTAMP, 
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE 
)
;

CREATE TABLE patient_diagnosis ( 
    patient_id INT, 
    diagnosis_id INT, 
    diagnosis_date TIMESTAMP, 
    PRIMARY KEY (patient_id, diagnosis_id), 
    FOREIGN KEY (patient_id) REFERENCES patient(patient_id) ON DELETE CASCADE, 
    FOREIGN KEY (diagnosis_id) REFERENCES diagnosis(diagnosis_id) 
)
;

CREATE TABLE payment ( 
    payment_id INT PRIMARY KEY, 
    bill_id INT, 
    payment_amount DECIMAL(10, 2), 
    payment_date TIMESTAMP, 
    payment_method_id INT, 
    payment_status_id INT, 
    FOREIGN KEY (bill_id) REFERENCES bill(bill_id), 
    FOREIGN KEY (payment_method_id) REFERENCES payment_method(payment_method_id), 
    FOREIGN KEY (payment_status_id) REFERENCES payment_status(payment_status_id) 
)
;

CREATE TABLE medicine ( 
    medicine_id INT PRIMARY KEY, 
    medicine_name VARCHAR(255) NOT NULL, 
    medicine_type VARCHAR(50), 
    dosage_form VARCHAR(50), 
    manufacturer VARCHAR(100) 
)
;

CREATE TABLE prescription ( 
    prescription_id INT PRIMARY KEY, 
    diagnosis_id INT, 
    medicine_id INT, 
    treatment_duration VARCHAR(50), 
    treatment_description VARCHAR(255), 
    start_date TIMESTAMP, 
    end_date TIMESTAMP, 
    prescription_date TIMESTAMP, 
    dosage VARCHAR(255), 
    instructions VARCHAR(255), 
    FOREIGN KEY (diagnosis_id) REFERENCES diagnosis(diagnosis_id), 
    FOREIGN KEY (medicine_id) REFERENCES medicine(medicine_id) 
)
;

CREATE INDEX idx_doctor_specialization ON doctor (specialization)
;

CREATE INDEX idx_appointment_date ON appointment (appointment_date)
;

CREATE OR REPLACE PACKAGE hospital_pkg AS 
    PROCEDURE insert_patient( 
        p_patient_id INT DEFAULT NULL,  
        p_fname VARCHAR2,  
        p_lname VARCHAR2,  
        p_address VARCHAR2,  
        p_phone VARCHAR2,  
        p_age INT,  
        p_gender CHAR,  
        p_insurance_no INT DEFAULT NULL,
        p_diagnosis_id INT DEFAULT NULL
    ); 
 
    PROCEDURE update_patient_phone(p_patient_id INT, p_phone VARCHAR2); 
    PROCEDURE delete_patient(p_patient_id INT); 
 
    -- Assign Employee Role 
    PROCEDURE assign_employee_role(p_emp_id INT, p_role VARCHAR2, p_specialization VARCHAR2 DEFAULT NULL, p_shift VARCHAR2 DEFAULT NULL); 
 
    -- Employee Procedures 
    PROCEDURE add_employee(p_emp_id INT, p_fname VARCHAR2, p_lname VARCHAR2, p_address VARCHAR2, p_phone_number VARCHAR2, p_salary DECIMAL, p_role_type_id INT, p_dept_id INT); 
    PROCEDURE update_employee(p_emp_id INT, p_fname VARCHAR2 DEFAULT NULL, p_lname VARCHAR2 DEFAULT NULL, p_address VARCHAR2 DEFAULT NULL, p_phone_number VARCHAR2 DEFAULT NULL, p_salary DECIMAL DEFAULT NULL, p_role_type_id INT DEFAULT NULL, p_dept_id INT DEFAULT NULL); 
    PROCEDURE delete_employee(p_emp_id INT); 
 
    -- Role Type Procedures 
    PROCEDURE add_role_type(p_role_type_id INT, p_role_type_name VARCHAR2); 
    PROCEDURE update_role_type(p_role_type_id INT, p_role_type_name VARCHAR2); 
    PROCEDURE delete_role_type(p_role_type_id INT); 
 
    -- Department Procedures 
    PROCEDURE add_department(p_dept_id INT, p_dept_name VARCHAR2, p_dept_block VARCHAR2, p_dept_floor VARCHAR2); 
    PROCEDURE update_department(p_dept_id INT, p_dept_name VARCHAR2, p_dept_block VARCHAR2, p_dept_floor VARCHAR2); 
    PROCEDURE delete_department(p_dept_id INT); 
 
    -- Insurance Procedures 
    PROCEDURE add_insurance(p_insurance_no INT, p_insurance_company VARCHAR2, p_expire_date DATE); 
    PROCEDURE update_insurance(p_insurance_no INT, p_insurance_company VARCHAR2, p_expire_date DATE); 
    PROCEDURE delete_insurance(p_insurance_no INT); 
 
    -- Diagnosis Procedures 
    PROCEDURE add_diagnosis(p_diagnosis_id INT, p_diagnosis_name VARCHAR2); 
    PROCEDURE update_diagnosis(p_diagnosis_id INT, p_diagnosis_name VARCHAR2); 
    PROCEDURE delete_diagnosis(p_diagnosis_id INT); 
 
    -- Doctor Procedures 
    PROCEDURE add_doctor(p_doctor_id INT, p_specialization VARCHAR2, p_emp_id INT); 
    PROCEDURE update_doctor(p_doctor_id INT, p_specialization VARCHAR2); 
    PROCEDURE delete_doctor(p_doctor_id INT); 
 
    -- Nurse Procedures 
    PROCEDURE add_nurse(p_nurse_id INT, p_shift VARCHAR2, p_emp_id INT); 
    PROCEDURE update_nurse(p_nurse_id INT, p_shift VARCHAR2); 
    PROCEDURE delete_nurse(p_nurse_id INT); 
 
    -- Appointment Procedures 
    PROCEDURE add_appointment(p_appointment_id INT, p_patient_id INT, p_doctor_id INT, p_dept_id INT, p_appointment_date TIMESTAMP, p_status VARCHAR2); 
    PROCEDURE update_appointment(p_appointment_id INT, p_status VARCHAR2); 
    PROCEDURE delete_appointment(p_appointment_id INT); 
 
    -- Payment Method Procedures 
    PROCEDURE add_payment_method(p_payment_method_id INT, p_method_name VARCHAR2); 
    PROCEDURE update_payment_method(p_payment_method_id INT, p_method_name VARCHAR2); 
    PROCEDURE delete_payment_method(p_payment_method_id INT); 
 
    -- Payment Status Procedures 
    PROCEDURE add_payment_status(p_payment_status_id INT, p_status_name VARCHAR2); 
    PROCEDURE update_payment_status(p_payment_status_id INT, p_status_name VARCHAR2); 
    PROCEDURE delete_payment_status(p_payment_status_id INT); 
 
    -- Payment Procedures 
    PROCEDURE add_payment(p_payment_id INT, p_bill_id INT, p_payment_amount DECIMAL, p_payment_date TIMESTAMP, p_payment_method_id INT, p_payment_status_id INT); 
    PROCEDURE update_payment(p_payment_id INT, p_payment_status_id INT); 
    PROCEDURE delete_payment(p_payment_id INT); 
 
    -- Bill Procedures 
    PROCEDURE add_bill(p_bill_id INT, p_patient_id INT, p_amount DECIMAL, p_issue_date TIMESTAMP); 
    PROCEDURE update_bill(p_bill_id INT, p_amount DECIMAL); 
    PROCEDURE delete_bill(p_bill_id INT); 
 
    -- Medicine Procedures 
    PROCEDURE add_medicine(p_medicine_id INT, p_medicine_name VARCHAR2, p_medicine_type VARCHAR2, p_dosage_form VARCHAR2, p_manufacturer VARCHAR2); 
    PROCEDURE update_medicine(p_medicine_id INT, p_medicine_name VARCHAR2); 
    PROCEDURE delete_medicine(p_medicine_id INT); 
 
    -- Prescription Procedures 
    PROCEDURE add_prescription(p_prescription_id INT, p_diagnosis_id INT, p_medicine_id INT, p_treatment_duration VARCHAR2, p_treatment_description VARCHAR2, p_start_date TIMESTAMP, p_end_date TIMESTAMP, p_dosage VARCHAR2, p_instructions VARCHAR2); 
    PROCEDURE update_prescription(p_prescription_id INT, p_dosage VARCHAR2); 
    PROCEDURE delete_prescription(p_prescription_id INT); 
END hospital_pkg; 

/

CREATE SEQUENCE patient_seq 
    START WITH 1 
    INCREMENT BY 1 
    NOCACHE
;
/

CREATE OR REPLACE PACKAGE BODY hospital_pkg AS 
 
--PATIENT     
    PROCEDURE insert_patient(
        p_patient_id INT DEFAULT NULL,
        p_fname VARCHAR2,
        p_lname VARCHAR2,
        p_address VARCHAR2,
        p_phone VARCHAR2,
        p_age INT,
        p_gender CHAR,
        p_insurance_no INT DEFAULT NULL,
        p_diagnosis_id INT DEFAULT NULL -- Yeni Parametre: Diagnosis ID
    ) IS
        v_patient_id INT;
    BEGIN
        -- Hasta ID'si otomatik oluşturulacaksa
        IF p_patient_id IS NULL THEN
            SELECT patient_seq.NEXTVAL INTO v_patient_id FROM DUAL;
        ELSE
            v_patient_id := p_patient_id;
        END IF;

        -- Hasta kaydını ekle
        INSERT INTO patient (
            patient_id, fname, lname, address, phone_number, age, gender, insurance_no
        ) VALUES (
            v_patient_id, p_fname, p_lname, p_address, p_phone, p_age, p_gender, p_insurance_no
        );

        -- Diagnosis kaydını ekle
        INSERT INTO patient_diagnosis (
            patient_id, diagnosis_id, diagnosis_date
        ) VALUES (
            v_patient_id, p_diagnosis_id, SYSDATE
        );

        -- Başarı mesajı
        DBMS_OUTPUT.PUT_LINE('Patient added with ID: ' || v_patient_id || ' and Diagnosis ID: ' || p_diagnosis_id);
    END insert_patient;
 
    -- Update patient phone
    PROCEDURE update_patient_phone(p_patient_id INT, p_phone VARCHAR2) IS 
    BEGIN 
        UPDATE patient 
        SET phone_number = p_phone 
        WHERE patient_id = p_patient_id; 
    END update_patient_phone; 
 
    -- Delete patient
    PROCEDURE delete_patient(p_patient_id INT) IS 
    BEGIN 
        DELETE FROM patient 
        WHERE patient_id = p_patient_id; 
    END delete_patient; 
 
--END PATIENT 
 
--EMPLOYEE 
 
    PROCEDURE add_employee( 
        p_emp_id INT, 
        p_fname VARCHAR2, 
        p_lname VARCHAR2, 
        p_address VARCHAR2, 
        p_phone_number VARCHAR2, 
        p_salary DECIMAL, 
        p_role_type_id INT, 
        p_dept_id INT 
    ) IS 
    BEGIN 
        INSERT INTO employee (emp_id, fname, lname, address, phone_number, salary, role_type_id, dept_id) 
        VALUES (p_emp_id, p_fname, p_lname, p_address, p_phone_number, p_salary, p_role_type_id, p_dept_id); 
        DBMS_OUTPUT.PUT_LINE('Employee added with ID: ' || p_emp_id); 
    END; 
     
 
    PROCEDURE update_employee( 
        p_emp_id INT, 
        p_fname VARCHAR2 DEFAULT NULL, 
        p_lname VARCHAR2 DEFAULT NULL, 
        p_address VARCHAR2 DEFAULT NULL, 
        p_phone_number VARCHAR2 DEFAULT NULL, 
        p_salary DECIMAL DEFAULT NULL, 
        p_role_type_id INT DEFAULT NULL, 
        p_dept_id INT DEFAULT NULL 
    ) IS 
    BEGIN 
        UPDATE employee 
        SET 
            fname = NVL(p_fname, fname), 
            lname = NVL(p_lname, lname), 
            address = NVL(p_address, address), 
            phone_number = NVL(p_phone_number, phone_number), 
            salary = NVL(p_salary, salary), 
            role_type_id = NVL(p_role_type_id, role_type_id), 
            dept_id = NVL(p_dept_id, dept_id) 
        WHERE emp_id = p_emp_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No employee found with ID: ' || p_emp_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Employee updated with ID: ' || p_emp_id); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_employee( 
        p_emp_id INT 
    ) IS 
    BEGIN 
        DELETE FROM employee WHERE emp_id = p_emp_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No employee found with ID: ' || p_emp_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Employee deleted with ID: ' || p_emp_id); 
        END IF; 
    END; 
     
 
 
    PROCEDURE assign_employee_role(p_emp_id INT, p_role VARCHAR2, p_specialization VARCHAR2 DEFAULT NULL, p_shift VARCHAR2 DEFAULT NULL) IS 
    BEGIN 
        -- Rolü kontrol et 
        IF UPPER(p_role) = 'DOCTOR' THEN 
            -- Doctor tablosuna ekle 
            INSERT INTO doctor (doctor_id, specialization, emp_id) 
            VALUES (p_emp_id, p_specialization, p_emp_id); 
            DBMS_OUTPUT.PUT_LINE('Employee ' || p_emp_id || ' assigned as Doctor with specialization: ' || p_specialization); 
        ELSIF UPPER(p_role) = 'NURSE' THEN 
            -- Nurse tablosuna ekle 
            INSERT INTO nurse (nurse_id, shift, emp_id) 
            VALUES (p_emp_id, p_shift, p_emp_id); 
            DBMS_OUTPUT.PUT_LINE('Employee ' || p_emp_id || ' assigned as Nurse with shift: ' || p_shift); 
        ELSE 
            -- Hatalı giriş durumunda uyarı 
            DBMS_OUTPUT.PUT_LINE('Invalid role! Please specify either "DOCTOR" or "NURSE".'); 
        END IF; 
    END assign_employee_role; 
 
--END EMPLOYEE 
 
-- ROLETYPE 
 
    PROCEDURE add_role_type( 
        p_role_type_id INT, 
        p_role_type_name VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO role_type (role_type_id, role_type_name) 
        VALUES (p_role_type_id, p_role_type_name); 
        DBMS_OUTPUT.PUT_LINE('Role Type added with ID: ' || p_role_type_id || ', Name: ' || p_role_type_name); 
    END; 
     
 
    PROCEDURE update_role_type( 
        p_role_type_id INT, 
        p_role_type_name VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE role_type 
        SET role_type_name = p_role_type_name 
        WHERE role_type_id = p_role_type_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Role Type found with ID: ' || p_role_type_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Role Type updated with ID: ' || p_role_type_id || ', New Name: ' || p_role_type_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_role_type( 
    p_role_type_id INT 
    ) IS 
    BEGIN 
        DELETE FROM role_type WHERE role_type_id = p_role_type_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Role Type found with ID: ' || p_role_type_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Role Type deleted with ID: ' || p_role_type_id); 
        END IF; 
    END; 
     
 
--END ROLE TYPE 
 
-- DEPARTMANT 
 
    PROCEDURE add_department( 
        p_dept_id INT, 
        p_dept_name VARCHAR2, 
        p_dept_block VARCHAR2, 
        p_dept_floor VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO departments (dept_id, dept_name, dept_block, dept_floor) 
        VALUES (p_dept_id, p_dept_name, p_dept_block, p_dept_floor); 
        DBMS_OUTPUT.PUT_LINE('Department added with ID: ' || p_dept_id || ', Name: ' || p_dept_name); 
    END; 
     
 
    PROCEDURE update_department( 
        p_dept_id INT, 
        p_dept_name VARCHAR2, 
        p_dept_block VARCHAR2, 
        p_dept_floor VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE departments 
        SET dept_name = p_dept_name, 
            dept_block = p_dept_block, 
            dept_floor = p_dept_floor 
        WHERE dept_id = p_dept_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Department found with ID: ' || p_dept_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Department updated with ID: ' || p_dept_id || ', New Name: ' || p_dept_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_department( 
        p_dept_id INT 
    ) IS 
    BEGIN 
        DELETE FROM departments WHERE dept_id = p_dept_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Department found with ID: ' || p_dept_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Department deleted with ID: ' || p_dept_id); 
        END IF; 
    END; 
     
 
-- END DEPARTMANT 
 
-- INSURANCE 
 
    PROCEDURE add_insurance( 
    p_insurance_no INT, 
    p_insurance_company VARCHAR2, 
    p_expire_date DATE 
    ) IS 
    BEGIN 
        INSERT INTO insurance (insurance_no, insurance_company, expire_date) 
        VALUES (p_insurance_no, p_insurance_company, p_expire_date); 
        DBMS_OUTPUT.PUT_LINE('Insurance added with Number: ' || p_insurance_no || ', Company: ' || p_insurance_company); 
    END; 
     
 
    PROCEDURE update_insurance( 
    p_insurance_no INT, 
    p_insurance_company VARCHAR2, 
    p_expire_date DATE 
    ) IS 
    BEGIN 
        UPDATE insurance 
        SET insurance_company = p_insurance_company, 
            expire_date = p_expire_date 
        WHERE insurance_no = p_insurance_no; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Insurance found with Number: ' || p_insurance_no); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Insurance updated with Number: ' || p_insurance_no || ', New Company: ' || p_insurance_company); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_insurance( 
    p_insurance_no INT 
    ) IS 
    BEGIN 
        DELETE FROM insurance WHERE insurance_no = p_insurance_no; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Insurance found with Number: ' || p_insurance_no); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Insurance deleted with Number: ' || p_insurance_no); 
        END IF; 
    END; 
     
 
-- END INSURANCE 
 
-- DIAGNOSIS 
 
    PROCEDURE add_diagnosis( 
        p_diagnosis_id INT, 
        p_diagnosis_name VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO diagnosis (diagnosis_id, diagnosis_name) 
        VALUES (p_diagnosis_id, p_diagnosis_name); 
        DBMS_OUTPUT.PUT_LINE('Diagnosis added with ID: ' || p_diagnosis_id || ', Name: ' || p_diagnosis_name); 
    END; 
     
 
    PROCEDURE update_diagnosis( 
    p_diagnosis_id INT, 
    p_diagnosis_name VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE diagnosis 
        SET diagnosis_name = p_diagnosis_name 
        WHERE diagnosis_id = p_diagnosis_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Diagnosis found with ID: ' || p_diagnosis_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Diagnosis updated with ID: ' || p_diagnosis_id || ', New Name: ' || p_diagnosis_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_diagnosis( 
    p_diagnosis_id INT 
    ) IS 
    BEGIN 
        DELETE FROM diagnosis WHERE diagnosis_id = p_diagnosis_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Diagnosis found with ID: ' || p_diagnosis_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Diagnosis deleted with ID: ' || p_diagnosis_id); 
        END IF; 
    END; 
     
 
--END DIAGNOSIS 
 
--DOCTOR 
    PROCEDURE add_doctor( 
    p_doctor_id INT, 
    p_specialization VARCHAR2, 
    p_emp_id INT 
    ) IS 
    BEGIN 
        INSERT INTO doctor (doctor_id, specialization, emp_id) 
        VALUES (p_doctor_id, p_specialization, p_emp_id); 
        DBMS_OUTPUT.PUT_LINE('Doctor added with ID: ' || p_doctor_id || ', Specialization: ' || p_specialization); 
    END; 
     
 
    PROCEDURE update_doctor( 
    p_doctor_id INT, 
    p_specialization VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE doctor 
        SET specialization = p_specialization 
        WHERE doctor_id = p_doctor_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Doctor found with ID: ' || p_doctor_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Doctor updated with ID: ' || p_doctor_id || ', New Specialization: ' || p_specialization); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_doctor( 
    p_doctor_id INT 
    ) IS 
    BEGIN 
        DELETE FROM doctor WHERE doctor_id = p_doctor_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Doctor found with ID: ' || p_doctor_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Doctor deleted with ID: ' || p_doctor_id); 
        END IF; 
    END; 
     
 
-- END DOCTOR 
 
-- NURSE 
 
    PROCEDURE add_nurse( 
        p_nurse_id INT, 
        p_shift VARCHAR2, 
        p_emp_id INT 
    ) IS 
    BEGIN 
        INSERT INTO nurse (nurse_id, shift, emp_id) 
        VALUES (p_nurse_id, p_shift, p_emp_id); 
        DBMS_OUTPUT.PUT_LINE('Nurse added with ID: ' || p_nurse_id || ', Shift: ' || p_shift); 
    END; 
     
 
    PROCEDURE update_nurse( 
    p_nurse_id INT, 
    p_shift VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE nurse 
        SET shift = p_shift 
        WHERE nurse_id = p_nurse_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Nurse found with ID: ' || p_nurse_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Nurse updated with ID: ' || p_nurse_id || ', New Shift: ' || p_shift); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_nurse( 
    p_nurse_id INT 
    ) IS 
    BEGIN 
        DELETE FROM nurse WHERE nurse_id = p_nurse_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Nurse found with ID: ' || p_nurse_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Nurse deleted with ID: ' || p_nurse_id); 
        END IF; 
    END; 
     
 
-- END NURSE 
 
-- APPOINTMENT 
 
    PROCEDURE add_appointment( 
    p_appointment_id INT, 
    p_patient_id INT, 
    p_doctor_id INT, 
    p_dept_id INT, 
    p_appointment_date TIMESTAMP, 
    p_status VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO appointment (appointment_id, patient_id, doctor_id, dept_id, appointment_date, status) 
        VALUES (p_appointment_id, p_patient_id, p_doctor_id, p_dept_id, p_appointment_date, p_status); 
        DBMS_OUTPUT.PUT_LINE('Appointment added with ID: ' || p_appointment_id); 
    END; 
     
 
    PROCEDURE update_appointment( 
    p_appointment_id INT, 
    p_status VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE appointment 
        SET status = p_status 
        WHERE appointment_id = p_appointment_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Appointment found with ID: ' || p_appointment_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Appointment updated with ID: ' || p_appointment_id || ', New Status: ' || p_status); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_appointment( 
    p_appointment_id INT 
    ) IS 
    BEGIN 
        DELETE FROM appointment WHERE appointment_id = p_appointment_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Appointment found with ID: ' || p_appointment_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Appointment deleted with ID: ' || p_appointment_id); 
        END IF; 
    END; 
     
 
-- END APPOINTMENT 
 
--PAYMENTMETOD 
 
    PROCEDURE add_payment_method( 
    p_payment_method_id INT, 
    p_method_name VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO payment_method (payment_method_id, method_name) 
        VALUES (p_payment_method_id, p_method_name); 
        DBMS_OUTPUT.PUT_LINE('Payment Method added with ID: ' || p_payment_method_id || ', Method Name: ' || p_method_name); 
    END; 
     
 
    PROCEDURE update_payment_method( 
    p_payment_method_id INT, 
    p_method_name VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE payment_method 
        SET method_name = p_method_name 
        WHERE payment_method_id = p_payment_method_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment Method found with ID: ' || p_payment_method_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment Method updated with ID: ' || p_payment_method_id || ', New Method Name: ' || p_method_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_payment_method( 
    p_payment_method_id INT 
    ) IS 
    BEGIN 
        DELETE FROM payment_method WHERE payment_method_id = p_payment_method_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment Method found with ID: ' || p_payment_method_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment Method deleted with ID: ' || p_payment_method_id); 
        END IF; 
    END; 
     
 
--END PAYMENTMETOD 
 
-- PAYMENT STATUS 
    PROCEDURE add_payment_status( 
    p_payment_status_id INT, 
    p_status_name VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO payment_status (payment_status_id, status_name) 
        VALUES (p_payment_status_id, p_status_name); 
        DBMS_OUTPUT.PUT_LINE('Payment Status added with ID: ' || p_payment_status_id || ', Status Name: ' || p_status_name); 
    END; 
     
 
    PROCEDURE update_payment_status( 
    p_payment_status_id INT, 
    p_status_name VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE payment_status 
        SET status_name = p_status_name 
        WHERE payment_status_id = p_payment_status_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment Status found with ID: ' || p_payment_status_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment Status updated with ID: ' || p_payment_status_id || ', New Status Name: ' || p_status_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_payment_status( 
    p_payment_status_id INT 
    ) IS 
    BEGIN 
        DELETE FROM payment_status WHERE payment_status_id = p_payment_status_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment Status found with ID: ' || p_payment_status_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment Status deleted with ID: ' || p_payment_status_id); 
        END IF; 
    END; 
     
 
-- END PAYMENT STATUS 
 
-- PAYMENT 
    PROCEDURE add_payment( 
        p_payment_id INT, 
        p_bill_id INT, 
        p_payment_amount DECIMAL, 
        p_payment_date TIMESTAMP, 
        p_payment_method_id INT, 
        p_payment_status_id INT 
    ) IS 
    BEGIN 
        INSERT INTO payment (payment_id, bill_id, payment_amount, payment_date, payment_method_id, payment_status_id) 
        VALUES (p_payment_id, p_bill_id, p_payment_amount, p_payment_date, p_payment_method_id, p_payment_status_id); 
        DBMS_OUTPUT.PUT_LINE('Payment added with ID: ' || p_payment_id); 
    END; 
     
 
    PROCEDURE update_payment( 
    p_payment_id INT, 
    p_payment_status_id INT 
    ) IS 
    BEGIN 
        UPDATE payment 
        SET payment_status_id = p_payment_status_id 
        WHERE payment_id = p_payment_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment found with ID: ' || p_payment_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment updated with ID: ' || p_payment_id || ', New Status ID: ' || p_payment_status_id); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_payment( 
    p_payment_id INT 
    ) IS 
    BEGIN 
        DELETE FROM payment WHERE payment_id = p_payment_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Payment found with ID: ' || p_payment_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Payment deleted with ID: ' || p_payment_id); 
        END IF; 
    END; 
     
 
-- END PAYMENT 
 
-- BILL 
 
    PROCEDURE add_bill( 
    p_bill_id INT, 
    p_patient_id INT, 
    p_amount DECIMAL, 
    p_issue_date TIMESTAMP 
    ) IS 
    BEGIN 
        INSERT INTO bill (bill_id, patient_id, amount, issue_date) 
        VALUES (p_bill_id, p_patient_id, p_amount, p_issue_date); 
        DBMS_OUTPUT.PUT_LINE('Bill added with ID: ' || p_bill_id); 
    END; 
     
 
    PROCEDURE update_bill( 
    p_bill_id INT, 
    p_amount DECIMAL 
    ) IS 
    BEGIN 
        UPDATE bill 
        SET amount = p_amount 
        WHERE bill_id = p_bill_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Bill found with ID: ' || p_bill_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Bill updated with ID: ' || p_bill_id || ', New Amount: ' || p_amount); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_bill( 
    p_bill_id INT 
    ) IS 
    BEGIN 
        DELETE FROM bill WHERE bill_id = p_bill_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Bill found with ID: ' || p_bill_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Bill deleted with ID: ' || p_bill_id); 
        END IF; 
    END; 
     
 
-- END BILL 
 
-- MEDICINE 
 
    PROCEDURE add_medicine( 
    p_medicine_id INT, 
    p_medicine_name VARCHAR2, 
    p_medicine_type VARCHAR2, 
    p_dosage_form VARCHAR2, 
    p_manufacturer VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO medicine (medicine_id, medicine_name, medicine_type, dosage_form, manufacturer) 
        VALUES (p_medicine_id, p_medicine_name, p_medicine_type, p_dosage_form, p_manufacturer); 
        DBMS_OUTPUT.PUT_LINE('Medicine added with ID: ' || p_medicine_id); 
    END; 
     
 
    PROCEDURE update_medicine( 
    p_medicine_id INT, 
    p_medicine_name VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE medicine 
        SET medicine_name = p_medicine_name 
        WHERE medicine_id = p_medicine_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Medicine found with ID: ' || p_medicine_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Medicine updated with ID: ' || p_medicine_id || ', New Name: ' || p_medicine_name); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_medicine( 
    p_medicine_id INT 
    ) IS 
    BEGIN 
        DELETE FROM medicine WHERE medicine_id = p_medicine_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Medicine found with ID: ' || p_medicine_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Medicine deleted with ID: ' || p_medicine_id); 
        END IF; 
    END; 
     
 
-- END MEDICINE 
 
-- PRESCRIPTION 
 
    PROCEDURE add_prescription( 
    p_prescription_id INT, 
    p_diagnosis_id INT, 
    p_medicine_id INT, 
    p_treatment_duration VARCHAR2, 
    p_treatment_description VARCHAR2, 
    p_start_date TIMESTAMP, 
    p_end_date TIMESTAMP, 
    p_dosage VARCHAR2, 
    p_instructions VARCHAR2 
    ) IS 
    BEGIN 
        INSERT INTO prescription (prescription_id, diagnosis_id, medicine_id, treatment_duration, treatment_description, start_date, end_date, dosage, instructions) 
        VALUES (p_prescription_id, p_diagnosis_id, p_medicine_id, p_treatment_duration, p_treatment_description, p_start_date, p_end_date, p_dosage, p_instructions); 
        DBMS_OUTPUT.PUT_LINE('Prescription added with ID: ' || p_prescription_id); 
    END; 
     
 
    PROCEDURE update_prescription( 
    p_prescription_id INT, 
    p_dosage VARCHAR2 
    ) IS 
    BEGIN 
        UPDATE prescription 
        SET dosage = p_dosage 
        WHERE prescription_id = p_prescription_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Prescription found with ID: ' || p_prescription_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Prescription updated with ID: ' || p_prescription_id || ', New Dosage: ' || p_dosage); 
        END IF; 
    END; 
     
 
    PROCEDURE delete_prescription( 
    p_prescription_id INT 
    ) IS 
    BEGIN 
        DELETE FROM prescription WHERE prescription_id = p_prescription_id; 
 
        IF SQL%ROWCOUNT = 0 THEN 
            DBMS_OUTPUT.PUT_LINE('No Prescription found with ID: ' || p_prescription_id); 
        ELSE 
            DBMS_OUTPUT.PUT_LINE('Prescription deleted with ID: ' || p_prescription_id); 
        END IF; 
    END; 
     
 
-- END PRESCRIPTION 
 
END hospital_pkg; 

/

CREATE OR REPLACE TRIGGER trg_patient_id 
    BEFORE INSERT ON patient 
    FOR EACH ROW 
    BEGIN 
        IF :NEW.patient_id IS NULL THEN 
            SELECT patient_seq.NEXTVAL INTO :NEW.patient_id FROM DUAL; 
        END IF; 
END; 

/




PROCEDURE delete_duplicates IS
BEGIN
    DELETE FROM patient
    WHERE ROWID NOT IN (
        SELECT MIN(ROWID)
        FROM patient
        GROUP BY fname, lname, phone_number
    );
    DBMS_OUTPUT.PUT_LINE('Duplicate records successfully deleted.');
END;
/

CREATE OR REPLACE PROCEDURE generate_report(p_gender CHAR) IS 
    CURSOR c_report IS 
        SELECT fname, lname, phone_number, age 
        FROM patient 
        WHERE gender = p_gender; 
BEGIN 
    FOR record IN c_report LOOP 
        DBMS_OUTPUT.PUT_LINE('Name: ' || record.fname || ' ' || record.lname || ', Phone: ' || record.phone_number || ', Age: ' || record.age); 
    END LOOP; 
END; 

/

BEGIN 
    hospital_pkg.add_insurance( 
        p_insurance_no => 1,  -- Sigorta Numarası 
        p_insurance_company => 'HealthCare Co.',  -- Sigorta Şirketi 
        p_expire_date => TO_DATE('2025-12-31', 'YYYY-MM-DD')  -- Son Kullanma Tarihi 
    ); 
    DBMS_OUTPUT.PUT_LINE('Insurance successfully added.'); 
END; 

/

BEGIN 
    hospital_pkg.add_insurance( 
        p_insurance_no => 2,  -- Sigorta Numarası 
        p_insurance_company => 'HealthCare Co.',  -- Sigorta Şirketi 
        p_expire_date => TO_DATE('2025-12-31', 'YYYY-MM-DD')  -- Son Kullanma Tarihi 
    ); 
    DBMS_OUTPUT.PUT_LINE('Insurance successfully added.'); 
END; 

/

BEGIN 
    hospital_pkg.add_insurance( 
        p_insurance_no => 3,  -- Sigorta Numarası 
        p_insurance_company => 'HealthCare Co.',  -- Sigorta Şirketi 
        p_expire_date => TO_DATE('2025-12-31', 'YYYY-MM-DD')  -- Son Kullanma Tarihi 
    ); 
    DBMS_OUTPUT.PUT_LINE('Insurance successfully added.'); 
END; 

/

BEGIN 
    hospital_pkg.add_diagnosis( 
        p_diagnosis_id => 1, 
        p_diagnosis_name => 'Hypertension' 
    ); 
    DBMS_OUTPUT.PUT_LINE('Diagnosis kaydı başarıyla eklendi.'); 
END; 

/

BEGIN 
    hospital_pkg.add_diagnosis( 
        p_diagnosis_id => 2, 
        p_diagnosis_name => 'Acne' 
    ); 
    DBMS_OUTPUT.PUT_LINE('Diagnosis kaydı başarıyla eklendi.'); 
END; 

/

BEGIN 
    hospital_pkg.add_diagnosis( 
        p_diagnosis_id => 3, 
        p_diagnosis_name => 'Flu' 
    ); 
    DBMS_OUTPUT.PUT_LINE('Diagnosis kaydı başarıyla eklendi.'); 
END; 

/


