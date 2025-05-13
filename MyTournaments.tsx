import React, { useEffect, useState } from 'react';
import { View, Text, FlatList,Image, TouchableOpacity, StyleSheet } from 'react-native';
import { getDatabase, ref, onValue,set,push } from 'firebase/database';
import { getAuth } from 'firebase/auth'; 
import { TextInput } from 'react-native';
export default function JobsScreen() {
  const [jobs, setJobs] = useState<any[]>([]);
  const [tab, setTab] = useState<'jobs' | 'applied'>('jobs');
  const [appliedJobs, setAppliedJobs] = useState<any[]>([]);
  const [expandedCard, setExpandedCard] = useState<string | null>(null);
  const [searchText, setSearchText] = useState('');
  const [user, setUser] = useState<any>(null);
  const [userType, setUserType] = useState('');
  const [filterLevel, setFilterLevel] = useState<'All' | 'Junior' | 'Mid' | 'Senior'>('All');
  const handleApply = async (item: any) => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (!currentUser) {
      alert("You must be logged in to apply.");
      return;
    }
  
    const db = getDatabase();
    const userRef = ref(db, `users/${currentUser.uid}`);
  
    onValue(userRef, async (snapshot) => {
      const userData = snapshot.val();
  
      if (userData?.userType === 'companies') {
        alert("You are a company. You can't apply to a job.");
        return;
      }
  
      const applicationData = {
        userId: currentUser.uid,
        name: userData.name,
        email: currentUser.email,
        profileImage: userData.personalInfo?.profileImage || '',
        experiences: userData.experiences?.list || [],
        educations: userData.educations?.list || [],
        projects: userData.projects?.list || [],
        certificates: userData.certificates?.list || [],
        appliedAt: new Date().toISOString(),
      };
  
      const companyApplicationRef = ref(
        db,
        `users/${item.companyId}/jobs/${item.jobIndex}/jobapplications/${currentUser.uid}`
      );
      await set(companyApplicationRef, applicationData);
  
      const userApplicationRef = ref(
        db,
        `users/${currentUser.uid}/appliedJobs`
      );
      await push(userApplicationRef, {
        jobId: item.jobIndex,
        companyId: item.companyId,
        companyName: item.companyName,
        companyLogo: item.companyLogo,
        position: item.position,
        description: item.description,
        level: item.level,
        location: item.location,
        appliedAt: new Date().toISOString(),
      });
  
      alert("Application submitted successfully!");
    }, { onlyOnce: true });
  };
  useEffect(() => {
    const db = getDatabase();
    const usersRef = ref(db, 'users');

    onValue(usersRef, (snapshot) => {
      const data = snapshot.val();
      const jobList: any[] = [];

      Object.entries(data || {}).forEach(([userId, userData]: any) => {
        if (userData.userType === 'companies' && Array.isArray(userData.jobs)) {
          userData.jobs.forEach((job: any, index: number) => {
            jobList.push({
              ...job,
              companyName: userData.name,
              companyId: userId,
              jobIndex: index,
              companyLogo: userData.personalInfo?.profileImageTwo || '', // ⭐ LOGO
              companyBanner: userData.personalInfo?.profileImage || '', // opsiyonel: varsa arkaplan
              jobapplications: job.jobapplications || {}, // başvuru sayısını görmek için
            });
          });
        }
      });

      setJobs(jobList);
    });
  }, []);
  const filteredJobs = jobs
  .filter((job) => {
    // Seviye filtresi
    if (filterLevel !== 'All' && job.level?.toLowerCase() !== filterLevel.toLowerCase()) {
      return false;
    }

    // Arama filtresi
    const search = searchText.toLowerCase();
    const jobTitle = job.position?.toLowerCase() || '';
    const company = job.companyName?.toLowerCase() || '';

    return jobTitle.includes(search) || company.includes(search);
  })
  .slice(0, 10); // max 10 iş
  useEffect(() => {
    if (user?.uid) {
      const db = getDatabase();
      const appliedRef = ref(db, `users/${user.uid}/appliedJobs`);
      onValue(appliedRef, (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const jobs = Object.values(data);
          setAppliedJobs(jobs);
        } else {
          setAppliedJobs([]);
        }
      });
    }
  }, [user]);
  useEffect(() => {
    const auth = getAuth();
    const currentUser = auth.currentUser;
    if (currentUser) {
      const db = getDatabase();
      const userRef = ref(db, `users/${currentUser.uid}`);
      onValue(userRef, (snapshot) => {
        setUser({ ...snapshot.val(), uid: currentUser.uid });
        setUserType(snapshot.val()?.userType);
      });
    }
  }, []);

  
  const handleAnswer = async (applicant: any, status: 'accepted' | 'rejected') => {
    const db = getDatabase();
    const refPath = `users/${applicant.userId}/appliedJobs`;
  
    const appliedRef = ref(db, refPath);
    onValue(appliedRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) return;
  
      Object.entries(data).forEach(([key, value]: any) => {
        if (
          value.jobId === applicant.jobId &&
          value.companyId === applicant.companyId
        ) {
          const updateRef = ref(db, `${refPath}/${key}/answer`);
          set(updateRef, status); // 🔥 işte burada answer yazılıyor
        }
      });
    }, { onlyOnce: true });
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    }); // örnek: 5 May 2025
  };

  const renderJobItem = ({ item }: any) => {
    const alreadyApplied = appliedJobs.some(
      (applied) =>
        applied.jobId === item.jobIndex && applied.companyId === item.companyId
    );
  
    const applicationCount = item.jobapplications
      ? Object.keys(item.jobapplications).length
      : 0;
  
      return (
        <View style={styles.cardContainer}>
          {/* Üst görsel + logo */}
          <View style={styles.headerSection}>
            <Image
              source={{ uri: item.companyBanner || item.companyLogo }}
              style={styles.bannerImage}
            />
            <View style={styles.logoContainer}>
              <Image
                source={{ uri: item.companyLogo }}
                style={styles.logoImage}
              />
            </View>
          </View>
      
          {/* İçerik */}
          <View style={styles.detailsSection}>
            <Text style={styles.jobTitle}>{item.position}</Text>
            <Text style={styles.companyText}>{item.companyName} • {item.level} • {item.location}</Text>
            <Text numberOfLines={2} style={styles.descText}>{item.description}</Text>
      
            {/* Başvuru sayısı */}
            <Text style={styles.appliedCount}>
              {applicationCount} {applicationCount === 1 ? 'person' : 'people'} applied
            </Text>
      
            {/* Buton (kartın en altında) */}
            <TouchableOpacity
              disabled={alreadyApplied}
              style={[
                styles.applyBtn,
                alreadyApplied && { backgroundColor: '#ccc' },
              ]}
              onPress={() => handleApply(item)}
            >
              <Text style={{ color: '#000', textAlign: 'center' }}>
                {alreadyApplied ? 'Applied' : 'Apply'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      );
  };

  return (
    <View style={{ flex: 1 }}>
      {/* Tabs */}
      <View style={styles.tabsContainer}>
        <TouchableOpacity
          style={[styles.tabButton, tab === 'jobs' && styles.tabSelected]}
          onPress={() => setTab('jobs')}
        >
          <Text style={[styles.tabText, tab === 'jobs' && styles.tabTextSelected]}>
            Jobs
          </Text>
        </TouchableOpacity>
        {userType === 'companies' ? (
  <TouchableOpacity
    style={[styles.tabButton, tab === 'applied' && styles.tabSelected]}
    onPress={() => setTab('applied')}
  >
    <Text style={[styles.tabText, tab === 'applied' && styles.tabTextSelected]}>
      People Applies
    </Text>
  </TouchableOpacity>
) : (
  <TouchableOpacity
    style={[styles.tabButton, tab === 'applied' && styles.tabSelected]}
    onPress={() => setTab('applied')}
  >
    <Text style={[styles.tabText, tab === 'applied' && styles.tabTextSelected]}>
      Applied Jobs
    </Text>
  </TouchableOpacity>
)}

      </View>
      <View style={{ paddingHorizontal: 16, marginBottom: 12 }}>
  <TextInput
    placeholder="Search by job title or company"
    value={searchText}
    onChangeText={setSearchText}
    style={{
      backgroundColor: '#fff',
      paddingHorizontal: 12,
      paddingVertical: 10,
      borderRadius: 10,
      fontSize: 14,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      elevation: 2,
    }}
  />
</View>
      <View style={{ flexDirection: 'row', justifyContent: 'center', marginBottom: 12 }}>
  {['All', 'Junior', 'Mid', 'Senior'].map((level) => (
    <TouchableOpacity
      key={level}
      onPress={() => setFilterLevel(level as any)}
      style={{
        backgroundColor: filterLevel === level ? '#628EA0' : '#ccc',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        marginHorizontal: 4,
      }}
    >
      <Text style={{ color: filterLevel === level ? '#fff' : '#000', fontWeight: '600' }}>
        {level}
      </Text>
    </TouchableOpacity>
  ))}
</View>

      {/* Job List */}
      {tab === 'jobs' ? (
        <FlatList
  data={filteredJobs}
  keyExtractor={(_, index) => index.toString()}
  renderItem={renderJobItem}
  contentContainerStyle={{ padding: 16 }}
/>
      ) : userType === 'companies' ? (
        <FlatList
          data={jobs.flatMap(job =>
            Object.values(job.jobapplications || {}).map(application => ({
              ...application,
              jobId: job.jobIndex,
              companyId: job.companyId,
              jobTitle: job.position,
              jobLevel: job.level,
              jobLocation: job.location,
              jobCompany: job.companyName,
            }))
          )}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            const isExpanded = expandedCard === item.userId;
          
            return (
              <View style={styles.appliedCard}>
                <View style={styles.appliedHeader}>
                  <Image source={{ uri: item.profileImage }} style={styles.appliedLogo} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.jobTitle}>{item.name}</Text>
                    <Text style={styles.companyText}>
                      {item.jobTitle} • {item.jobLevel} • {item.jobLocation}
                    </Text>
                  </View>
                </View>
          
                <View style={styles.appliedMeta}>
                  <Text style={styles.dateText}>Applied at {formatDate(item.appliedAt)}</Text>
                  <Text style={styles.statusText}>{item.email}</Text>
                </View>
          
                <TouchableOpacity
                  style={styles.detailsButton}
                  onPress={() => setExpandedCard(isExpanded ? null : item.userId)}
                >
                  <Text style={styles.detailsButtonText}>
                    {isExpanded ? 'Hide Details' : 'View Details'}
                  </Text>
                </TouchableOpacity>
          
                {isExpanded && (
  <View style={styles.expandedSection}>
    <Text style={styles.sectionTitle}>🎓 Education</Text>
    {item.educations?.map((edu, i) => (
      <View key={i} style={styles.detailBox}>
        <Text style={styles.detailLabel}>{edu.schoolName}</Text>
        <Text style={styles.detailSub}>{edu.degreeType} • {edu.department}</Text>
      </View>
    ))}

    <Text style={styles.sectionTitle}>💼 Experience</Text>
    {item.experiences?.map((exp, i) => (
      <View key={i} style={styles.detailBox}>
        <Text style={styles.detailLabel}>{exp.company}</Text>
        <Text style={styles.detailSub}>{exp.role} • {exp.employmentType}</Text>
      </View>
    ))}

    <Text style={styles.sectionTitle}>🛠 Projects</Text>
    {item.projects?.map((proj, i) => (
      <View key={i} style={styles.detailBox}>
        <Text style={styles.detailLabel}>{proj.projectName}</Text>
        <Text style={styles.detailSub}>{proj.description}</Text>
      </View>
    ))}

    <Text style={styles.sectionTitle}>📄 Certificates</Text>
    {item.certificates?.map((cert, i) => (
      <View key={i} style={styles.detailBox}>
        <Text style={styles.detailLabel}>{cert.certificateName}</Text>
        <Text style={styles.detailSub}>{cert.organization}</Text>
      </View>
    ))}

    {/* Accept / Reject buttons */}
    <View style={styles.buttonRow}>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#EF9A9A' }]}
        onPress={() => handleAnswer(item, 'rejected')}
      >
        <Text style={styles.buttonText}>Reject</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.actionButton, { backgroundColor: '#A5D6A7' }]}
        onPress={() => handleAnswer(item, 'accepted')}
      >
        <Text style={styles.buttonText}>Accept</Text>
      </TouchableOpacity>
    </View>
  </View>
)}
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16 }}
        />
      ) : (
        <FlatList
          data={appliedJobs}
          keyExtractor={(_, index) => index.toString()}
          renderItem={({ item }) => {
            const answer = item.answer || 'pending';
            const statusStyles = {
              pending: { text: 'Pending', color: '#888', shadow: '#ccc' },
              accepted: { text: 'Accepted', color: '#2E7D32', shadow: '#A5D6A7' },
              reject: { text: 'Rejected', color: '#C62828', shadow: '#EF9A9A' },
            };
            const currentStyle = statusStyles[answer];
      
            return (
              <View
                style={[
                  styles.appliedCard,
                  {
                    shadowColor: currentStyle.shadow,
                    borderLeftWidth: 4,
                    borderLeftColor: currentStyle.color,
                  },
                ]}
              >
                <View style={styles.appliedHeader}>
                  <Image source={{ uri: item.companyLogo }} style={styles.appliedLogo} />
                  <View style={{ marginLeft: 12 }}>
                    <Text style={styles.jobTitle}>{item.position}</Text>
                    <Text style={styles.companyText}>
                      {item.companyName} • {item.level} • {item.location}
                    </Text>
                  </View>
                </View>
                <View style={styles.appliedMeta}>
                  <Text style={styles.dateText}>Applied at {formatDate(item.appliedAt)}</Text>
                  <Text style={[styles.statusText, { color: currentStyle.color }]}>
                    {currentStyle.text}
                  </Text>
                </View>
              </View>
            );
          }}
          contentContainerStyle={{ padding: 16 }}
        />
      )}
      
    </View>
  );
}

const styles = StyleSheet.create({
  expandedSection: {
    marginTop: 16,
    padding: 12,
    backgroundColor: '#FAFAFA',
    borderRadius: 10,
  },
  sectionTitle: {
    fontWeight: 'bold',
    fontSize: 14,
    marginVertical: 6,
    color: '#333',
  },
  detailBox: {
    padding: 8,
    backgroundColor: '#fff',
    borderRadius: 8,
    marginBottom: 6,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  detailLabel: {
    fontWeight: '600',
    fontSize: 13,
    color: '#111',
  },
  detailSub: {
    fontSize: 12,
    color: '#555',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 12,
  },
  actionButton: {
    flex: 1,
    marginHorizontal: 4,
    paddingVertical: 10,
    borderRadius: 6,
    alignItems: 'center',
  },
  buttonText: {
    color: '#000',
    fontWeight: '600',
  },
  detailsButton: {
    marginTop: 10,
    paddingVertical: 8,
    backgroundColor: '#E0F7FA',
    borderRadius: 8,
  },
  detailsButtonText: {
    textAlign: 'center',
    color: '#00796B',
    fontWeight: '600',
  },
  detailText: {
    fontSize: 13,
    color: '#555',
    marginBottom: 3,
  },
  appliedMeta: {
    marginTop: 10,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  statusText: {
    fontWeight: '400',
    fontSize: 13,
  },
  dateText: {
    color: '#555',
    fontSize: 13,
  },
  appliedCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 5,
  },
  appliedHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appliedLogo: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#eee',
  },
  cardContainer: {
    backgroundColor: '#fff',
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  headerSection: {
    position: 'relative',
    height: 140,
    backgroundColor: '#eee',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
  },
  logoContainer: {
    position: 'absolute',
    bottom: -24,
    left: 16,
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: '#ccc',
  },
  logoImage: {
    width: 44,
    height: 44,
    borderRadius: 22,
  },
  detailsSection: {
    padding: 16,
    paddingTop: 32,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  companyText: {
    fontSize: 13,
    color: '#666',
    marginBottom: 6,
  },
  descText: {
    fontSize: 13,
    color: '#444',
    marginBottom: 10,
  },
  bottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  badge: {
    backgroundColor: '#f1f1f1',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 20,
    fontSize: 12,
    color: '#555',
  },
  applyBtn: {
    marginTop: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: '#fff',

    shadowColor: '#628EA0',
    shadowOpacity: 0.6,
    shadowRadius: 6,
    elevation: 4,
  },
  appliedCount: {
    color: '#888',
    fontSize: 13,
    fontStyle: 'italic',
  },
  jobHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  companyLogo: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: '#eee',
  },
  companyName: {
    fontSize: 14,
    color: '#555',
  },
  description: {
    marginBottom: 6,
    color: '#333',
  },
  skillsText: {
    color: '#777',
    fontStyle: 'italic',
    marginBottom: 4,
  },
  locationText: {
    color: '#444',
    marginBottom: 4,
  },
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 50,
    marginBottom: 16,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: 20,
    backgroundColor: '#e0e0e0',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    
  },
  tabSelected: {
    backgroundColor: '#628EA0',

    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  tabText: {
    fontSize: 16,
    color: '#333',
    fontWeight: '600',
  },
  tabTextSelected: {
    color: 'white',
  },
  jobCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 12,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 6,
    elevation: 4,
  },
  title: {
    fontWeight: 'bold',
    fontSize: 16,
  },
 
});